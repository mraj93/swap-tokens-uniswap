import {ethers} from 'ethers'
import UNISWAP_ROUTER_ABI from '../Abis/version2Router.json'
import USDT_ABI from '../Abis/ERC20.json'
import UNI_ABI from "../Abis/uni.json"

const signerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Update with your signer address
// const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/')
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

// Connect to the wallet to sign on chain
const wallet = new ethers.Wallet(privateKey, provider)

const ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

// Contract interfaces
const ROUTER_CONTRACT = new ethers.Contract(ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, wallet)
const USDT_CONTRACT = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider)
const UNI_CONTRACT = new ethers.Contract(UNI_ADDRESS, UNI_ABI, provider)

const maxAllowance = ethers.constants.MaxUint256

let ETH_balance: any
let USDT_balance: any
let UNI_balance: any

let usdtDecimals: ethers.BigNumber
let uniDecimals: ethers.BigNumber


// TODO Log tokens balances of an user account
const logBalances = async () => {
    usdtDecimals = await USDT_CONTRACT.decimals()
    uniDecimals = await UNI_CONTRACT.decimals()

    ETH_balance = await provider.getBalance(signerAddress)
    USDT_balance = await USDT_CONTRACT.balanceOf(signerAddress)
    UNI_balance = await UNI_CONTRACT.balanceOf(signerAddress)


    console.log('\x1b[35m%s\x1b[0m', 'ETH:', ethers.utils.formatUnits(ETH_balance, '18'))
    console.log('\x1b[35m%s\x1b[0m', 'UNI_CONTRACT', ethers.utils.formatUnits(UNI_balance, uniDecimals))
    console.log('\x1b[35m%s\x1b[0m', 'USDT_CONTRACT:', ethers.utils.formatUnits(USDT_balance, usdtDecimals))

    // const wethBalance: any = await weth.methods.balanceOf(signerAddress).call()
    // console.log('\x1b[31m%s\x1b[0m', 'wethBalance', Number(wethBalance))
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// To Swap native coin to desired token
const swapCoinToTokens = async () => {
    try {

        return

        console.log('\x1b[37m%s\x1b[0m', "************** Before swapping token holdings are ***********")
        await logBalances()
        await delay(500);

        // return
        const amountIn = ethers.utils.parseEther("1"); // Change native coin values as per requirement
        const PATH = [WETH_ADDRESS, USDT_ADDRESS];
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

        // To peform the SWAP operation and add them on chain
        const transcation = await ROUTER_CONTRACT.swapExactETHForTokens(
            0,
            PATH,
            wallet.address,
            deadline,
            {
                value: amountIn,
                gasPrice: ethers.utils.parseUnits("30", "gwei")
            }
        );

        // Wait to be transaction to be completed
        await transcation.wait();
        console.log("Transaction Hash:", transcation.hash);

        const hash = transcation.hash;
        console.log("Swap completed successfully");
        console.log(`Transaction details are`, await provider.getTransaction(hash))
        console.log('\x1b[37m%s\x1b[0m', "************** After swap holdings tokens***********")
        await logBalances();
        await delay(200)
    } catch (err) {
        console.error("error", err)
    }
}
const tokenToTokenSwap = async (amountIn: ethers.BigNumber, PATH: string[], amountOutMin: any, deadline: Number) => {
    try {
        const gasPrice = await provider.getGasPrice();
        const gasLimit = 30000000; // You can adjust this as needed
        const gasPriceWithBuffer = gasPrice.mul(2); // You can adjust this multiplier as needed

        console.log("gasPrice", gasPrice)

        return

        // Execute the swap
        const tx = await ROUTER_CONTRACT.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            PATH,
            wallet.address,
            deadline,
            {
                gasLimit: gasLimit,
                gasPrice: gasPriceWithBuffer,
                // gasPrice: ethers.utils.parseUnits('120', 'gwei'),
            }, // Adjust gas limit and gas price as needed
        )

        // Wait for the transaction to be mined
        const receipt = await tx.wait()
        console.log('Transaction receipt:', receipt)

        // Get the transaction hash
        const txHash = receipt.transactionHash
        console.log('Transaction Hash:', txHash)

        // Get the transaction details
        const txDetails = await provider.getTransaction(txHash)
        console.log('Transaction Details:', txDetails)

        console.log(`After swap`)
        await logBalances()
    } catch (err) {
        console.error("error", err)
    }
}

const swapTokensToExactTokens = async () => {
    try {
        const amountToTrade: ethers.BigNumber = ethers.utils.parseUnits('100', '6') // Note : Use decimals value of input token
        const path: string[] = [USDT_ADDRESS, UNI_ADDRESS]
        const slippageTolerance = 50 // 50 basis points (0.5%)  // Specify slippage tolerance
        const deadlineTime: Number = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time

        // Get the minimum amount of tokens to receive after the swap
        const amountsOutMin = await ROUTER_CONTRACT.getAmountsOut(amountToTrade, path)
        const amountOutMin: any = amountsOutMin[1].sub(amountsOutMin[1].mul(slippageTolerance).div(10000))

        const allowed: ethers.BigNumber = await USDT_CONTRACT.allowance(signerAddress, ROUTER_ADDRESS)
        console.log(`allowance`, allowed.toString())
        const approvedTokensToRouter: ethers.BigNumber = ethers.BigNumber.from(allowed.toString());
        console.log(`approvedTokensToRouter`, approvedTokensToRouter)

        await logBalances()

        if (amountToTrade.lte(approvedTokensToRouter)) {
            console.log("in if");
            await tokenToTokenSwap(amountToTrade, path, amountOutMin, deadlineTime);
            // return
        } else {
            console.log("in else");

            // Approving tokens to the router
            const approveTx = await USDT_CONTRACT.connect(wallet).approve(ROUTER_ADDRESS, maxAllowance)
            const approveTxReceipt = await approveTx.wait()
            console.log('Approval transaction receipt:', approveTxReceipt)
            console.log(`Approve details`, await provider.getTransaction(approveTxReceipt))

            await tokenToTokenSwap(amountToTrade, path, amountOutMin, deadlineTime)
        }

        return
        // Get the token contract instance
        const tokenContract = new ethers.Contract(UNI_ADDRESS, ['function approve(address spender, uint amount) returns (bool)'], wallet)

        // Approve the Uniswap router to spend tokens on behalf of the user
        // const approveTx = await UNI_CONTRACT.connect(wallet).approve(ROUTER_ADDRESS, maxAllowance)
        // const approveTx = await USDT_CONTRACT.connect(wallet).approve(ROUTER_ADDRESS, maxAllowance)
        // // const approveTx = await UNI_CONTRACT.approve(ROUTER_ADDRESS, maxAllowance)
        // const approveTxReceipt = await approveTx.wait()
        // console.log('Approval transaction receipt:', approveTxReceipt)
        // console.log(`Approve details`, await provider.getTransaction(approveTxReceipt))

        // const allowed: any = await USDT_CONTRACT.allowance(signerAddress, ROUTER_ADDRESS)
        // console.log(`allowance`, allowed.toString())
        // const approvedTokensToRouter = ethers.BigNumber.from(allowed.toString());
        // console.log(`approvedTokensToRouter`, approvedTokensToRouter)

    } catch (err: any) {
        console.error(`error`, err)
    }
}

async function swapTokens() {

    return

    await swapCoinToTokens()

    await swapTokensToExactTokens()

    return
}

swapTokens().catch(console.error)
