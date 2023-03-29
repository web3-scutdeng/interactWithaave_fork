//know more about defi:Speed Run etherum

const { getWeth, Amount } = require("./getWeth")
const { getNamedAccounts, ethers } = require("hardhat")

async function getlendingpool(account) {
    const lendingpoolAdressprovider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )
    const lendingpooladdress = await lendingpoolAdressprovider.getLendingPool()
    const lendingpool = await ethers.getContractAt("ILendingPool", lendingpooladdress, account)
    return lendingpool
}

//批准函数
async function approveERC20(erc20address, to, amountToApprove, account) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20address, account)
    console.log("waiting to get approved")
    const tx = await erc20Token.approve(to, amountToApprove)
    await tx.wait(1)
    console.log(`approved${to} erc20token ${amountToApprove}`)
}

async function getBorrowdata(lendingpool, acount) {
    //借贷池的地址，账户；
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingpool.getUserAccountData(acount)
    console.log(`you have  totalCollateral:${totalCollateralETH}`)
    console.log(`you have  totalDebt:${totalDebtETH}`)
    console.log(`you have  availableBorrows:${availableBorrowsETH}`)
    return { totalCollateralETH, totalDebtETH, availableBorrowsETH }
}

//拿到dai的price
async function getDAIprice() {
    const DAIethpricefeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    ) //不需要连接账户，因为不会发送交易
    const priceDAI = (await DAIethpricefeed.latestRoundData())[1]
    console.log(`the DAIprice/ETH is ${priceDAI}`)
    return priceDAI
}

async function borrowDAI(daiAddress, lendingpool, amountDAItoBorrowWei, account) {
    const borrowtx = await lendingpool.borrow(daiAddress, amountDAItoBorrowWei, 1, 0, account)
    await borrowtx.wait(1)
    console.log("you borrowed!")
}

async function repay(amount, daiAddress, lendingpool, account) {
    await approveERC20(daiAddress, lendingpool.address, amount, account)
    const repaytx = await lendingpool.repay(daiAddress, amount, 1, account)
    await repaytx.wait(1)
    console.log(`repaied...${amount}`)
}
async function main() {
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const lendingpool = await getlendingpool(deployer)
    console.log(`lendingpooladdress:${lendingpool.address}...`)

    //deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    // approve
    await approveERC20(wethTokenAddress, lendingpool.address, Amount, deployer)
    console.log("depositing...")
    await lendingpool.deposit(wethTokenAddress, Amount, deployer, 0)
    console.log("deposited!!!")

    //BorrowTime
    let { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await getBorrowdata(
        lendingpool,
        deployer
    )
    //DAIprice
    const daiprice = await getDAIprice()
    //how much DAi can Borrow
    // console.log(`daiprice.toNumber()${daiprice.toNumber()}`)
    // console.log(`availableBorrowsETH.toString()${availableBorrowsETH.toString()}`)
    const DAItoBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiprice.toNumber()) //??
    console.log(`you can borrow ${DAItoBorrow}amount...`)

    const amountDAIToBorrowwei = ethers.utils.parseEther(DAItoBorrow.toString())

    daiTokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
    await borrowDAI(daiTokenAddress, lendingpool, amountDAIToBorrowwei, deployer)

    await getBorrowdata(lendingpool, deployer)

    //repay
    await repay(amountDAIToBorrowwei, daiTokenAddress, lendingpool, deployer)

    await getBorrowdata(lendingpool, deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
