const { getNamedAccounts, ethers } = require("hardhat")
const Amount = ethers.utils.parseEther("0.02")
async function getWeth() {
    const { deployer } = await getNamedAccounts()
    console.log(deployer)

    //0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

    const iweth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    )
    const tx = await iweth.deposit({ value: Amount })
    await tx.wait(1)
    const wethbalance = await iweth.balanceOf(deployer)
    console.log(`got ${wethbalance}...`)
    console.log(`got ${wethbalance.toString()}...`)
}

module.exports = { getWeth, Amount }
