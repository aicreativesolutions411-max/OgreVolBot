// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.28;

/// @notice Minimal ERC-20 used by the automatic SlimeWire/Sushi launch rail.
/// The supply is fixed forever. There is no owner, mint, pause, tax, blacklist,
/// or upgrade hook. The launch factory sends the complete supply into locked
/// Sushi V3 liquidity (rounding dust is burned).
contract SlimeSushiTokenRH {
    string public name;
    string public symbol;
    string public contractURI;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, uint256 supply_, string memory contractURI_) {
        require(bytes(name_).length > 0 && bytes(name_).length <= 64, "bad name");
        require(bytes(symbol_).length > 0 && bytes(symbol_).length <= 12, "bad symbol");
        require(supply_ > 0, "bad supply");
        name = name_;
        symbol = symbol_;
        contractURI = contractURI_;
        totalSupply = supply_;
        balanceOf[msg.sender] = supply_;
        emit Transfer(address(0), msg.sender, supply_);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "allowance");
            unchecked { allowance[from][msg.sender] = allowed - value; }
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "zero to");
        uint256 balance = balanceOf[from];
        require(balance >= value, "balance");
        unchecked {
            balanceOf[from] = balance - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}

interface ISlimeERC20 {
    function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

interface ISushiV3PositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool);

    function mint(MintParams calldata params)
        external
        payable
        returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);

    function collect(CollectParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);

    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );
}

interface ISushiV3PoolState {
    function slot0()
        external
        view
        returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool);
}

/// @notice Permanently holds every launch position. There is intentionally no
/// function that can transfer an NFT or decrease liquidity. Anyone may trigger
/// fee collection; 100% of both assets goes directly to the recorded creator.
contract SlimeSushiPositionLockerRH {
    ISushiV3PositionManager public immutable positionManager;
    address public immutable launchFactory;
    mapping(uint256 => address) public creatorOf;

    event PositionLocked(uint256 indexed tokenId, address indexed creator);
    event FeesCollected(uint256 indexed tokenId, address indexed creator, uint256 amount0, uint256 amount1);

    constructor(address positionManager_, address launchFactory_) {
        require(positionManager_ != address(0) && launchFactory_ != address(0), "bad config");
        positionManager = ISushiV3PositionManager(positionManager_);
        launchFactory = launchFactory_;
    }

    function register(uint256 tokenId, address creator) external {
        require(msg.sender == launchFactory, "factory only");
        require(creator != address(0) && creatorOf[tokenId] == address(0), "bad creator");
        creatorOf[tokenId] = creator;
        emit PositionLocked(tokenId, creator);
    }

    function collectFees(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
        address creator = creatorOf[tokenId];
        require(creator != address(0), "unknown position");
        (, , address token0, address token1, , , , , , , , ) = positionManager.positions(tokenId);
        uint256 before0 = ISlimeERC20(token0).balanceOf(address(this));
        uint256 before1 = ISlimeERC20(token1).balanceOf(address(this));
        positionManager.collect(ISushiV3PositionManager.CollectParams({
            tokenId: tokenId,
            recipient: address(this),
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        }));
        amount0 = ISlimeERC20(token0).balanceOf(address(this)) - before0;
        amount1 = ISlimeERC20(token1).balanceOf(address(this)) - before1;
        if (amount0 > 0) _safeTransfer(token0, creator, amount0);
        if (amount1 > 0) _safeTransfer(token1, creator, amount1);
        emit FeesCollected(tokenId, creator, amount0, amount1);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function _safeTransfer(address token, address to, uint256 amount) private {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSelector(ISlimeERC20.transfer.selector, to, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "transfer failed");
    }
}

/// @dev Uniswap/Sushi V3 TickMath, retained under GPL-2.0-or-later.
library SlimeTickMathRH {
    int24 internal constant MIN_TICK = -887272;
    int24 internal constant MAX_TICK = 887272;

    function getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        uint256 absTick = tick < 0 ? uint256(uint24(-tick)) : uint256(uint24(tick));
        require(absTick <= uint256(uint24(MAX_TICK)), "tick");
        uint256 ratio = absTick & 0x1 != 0 ? 0xfffcb933bd6fad37aa2d162d1a594001 : 0x100000000000000000000000000000000;
        if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
        if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
        if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
        if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
        if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
        if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
        if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;
        if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;
        if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;
        if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;
        if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;
        if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;
        if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;
        if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;
        if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;
        if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;
        if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;
        if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;
        if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;
        if (tick > 0) ratio = type(uint256).max / ratio;
        sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
    }
}

/// @notice Permissionless, non-upgradeable one-click launcher for Sushi V3 on
/// Robinhood Chain. CREATE2 is used so the backend can choose a token address
/// below WETH, allowing the whole supply to seed a one-sided rising curve.
contract SlimeSushiLaunchFactoryRH {
    uint24 public constant POOL_FEE = 10_000; // 1%, appropriate for volatile launches
    int24 public constant TICK_SPACING = 200;
    int24 public constant MAX_USABLE_TICK = 887_200;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    ISushiV3PositionManager public immutable positionManager;
    address public immutable wrappedNative;
    address public immutable treasury;
    uint256 public immutable launchFeeWei;
    SlimeSushiPositionLockerRH public immutable locker;

    event TokenLaunched(
        address indexed token,
        address indexed creator,
        address indexed pool,
        uint256 tokenId,
        uint256 supply,
        int24 initialTick,
        uint128 liquidity,
        uint256 tokensLocked
    );

    constructor(address positionManager_, address wrappedNative_, address treasury_, uint256 launchFeeWei_) {
        require(positionManager_ != address(0) && wrappedNative_ != address(0) && treasury_ != address(0), "bad config");
        positionManager = ISushiV3PositionManager(positionManager_);
        wrappedNative = wrappedNative_;
        treasury = treasury_;
        launchFeeWei = launchFeeWei_;
        locker = new SlimeSushiPositionLockerRH(positionManager_, address(this));
    }

    function predictTokenAddress(
        string calldata name_,
        string calldata symbol_,
        uint256 supply_,
        string calldata contractURI_,
        bytes32 salt
    ) external view returns (address) {
        bytes32 initHash = keccak256(abi.encodePacked(
            type(SlimeSushiTokenRH).creationCode,
            abi.encode(name_, symbol_, supply_, contractURI_)
        ));
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, initHash)))));
    }

    function launch(
        string calldata name_,
        string calldata symbol_,
        uint256 supply_,
        string calldata contractURI_,
        int24 initialTick,
        address creator,
        bytes32 salt
    ) external payable returns (address token, address pool, uint256 tokenId) {
        require(msg.value >= launchFeeWei, "launch fee");
        require(creator != address(0), "bad creator");
        require(initialTick % TICK_SPACING == 0, "unaligned tick");
        require(initialTick >= -887_200 && initialTick < MAX_USABLE_TICK, "tick range");

        SlimeSushiTokenRH deployed = new SlimeSushiTokenRH{salt: salt}(name_, symbol_, supply_, contractURI_);
        token = address(deployed);
        require(uint160(token) < uint160(wrappedNative), "salt must put token below WETH");

        uint160 sqrtPriceX96 = SlimeTickMathRH.getSqrtRatioAtTick(initialTick);
        pool = positionManager.createAndInitializePoolIfNecessary(token, wrappedNative, POOL_FEE, sqrtPriceX96);
        (uint160 liveSqrtPriceX96, int24 liveTick, , , , , ) = ISushiV3PoolState(pool).slot0();
        // CREATE2 makes the token address knowable before launch. If someone
        // pre-created that pool at a different price, fail closed and let the
        // client retry with a new salt instead of accepting a poisoned market.
        require(liveSqrtPriceX96 == sqrtPriceX96 && liveTick == initialTick, "pool price changed");
        require(deployed.approve(address(positionManager), supply_), "approve failed");

        uint128 liquidity;
        uint256 amount0;
        uint256 amount1;
        (tokenId, liquidity, amount0, amount1) = positionManager.mint(ISushiV3PositionManager.MintParams({
            token0: token,
            token1: wrappedNative,
            fee: POOL_FEE,
            tickLower: initialTick,
            tickUpper: MAX_USABLE_TICK,
            amount0Desired: supply_,
            amount1Desired: 0,
            amount0Min: 1,
            amount1Min: 0,
            recipient: address(locker),
            deadline: block.timestamp + 300
        }));
        require(liquidity > 0 && amount0 > 0 && amount1 == 0, "bad liquidity");
        locker.register(tokenId, creator);

        uint256 dust = deployed.balanceOf(address(this));
        if (dust > 0) require(deployed.transfer(BURN_ADDRESS, dust), "dust burn failed");

        if (launchFeeWei > 0) {
            (bool paid, ) = treasury.call{value: launchFeeWei}("");
            require(paid, "fee payment failed");
        }
        uint256 refund = msg.value - launchFeeWei;
        if (refund > 0) {
            (bool refunded, ) = msg.sender.call{value: refund}("");
            require(refunded, "refund failed");
        }
        emit TokenLaunched(token, creator, pool, tokenId, supply_, initialTick, liquidity, amount0);
    }
}
