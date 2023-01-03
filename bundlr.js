import Bundlr from "@bundlr-network/client";
import { stat, statSync } from "fs";
import path from 'path';

import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

//global configuration object
const config = {
    app:{
        name: "Bundlr Demo",
        version: "0.1.1",
        contentType: "text/html"
    },
    env:{
        dev:{
            gateway: "https://devnet.bundlr.network",
            currency: "matic",
            rpc: "https://rpc-mumbai.maticvigil.com"
        },
        prod:
        {
            gateway: "https://arweave.net",
            currency: "matic",
            rpc: "matic-rpc.com"

        }
    },
    currency: "matic",
    rpc: "https://rpc-mumbai.maticvigil.com/",
    key: process.env.WALLET_KEY,
    default:{
        payload: "hello mastermind",
        file:{
            path:"./src/assets/demo-file.jpeg",
        },
        folderPath: "./src",
        fund:{
            amount: 4_444_424
        }
    }
}

async function getFileSize(filePath){
    const pathToFile = filePath ? filePath : config.default.file.path
    const {size} = statSync(pathToFile)
    return size
}

async function getUploadPrice(uploadSize){
    const size = uploadSize ? uploadSize : config.default.dataSize
    const atomicPrice = await bundlr.getPrice(size)
    const convertedPrice = bundlr.utils.unitConverter(atomicPrice)
    return {atomicPrice, convertedPrice}
}

// Connect to a Bundlr Node
const bundlr = new Bundlr.default(config.env.dev.gateway, config.env.dev.currency, config.key, { providerUrl: config.env.dev.rpc});
await bundlr.ready()

console.log(`Your Bundlr node is funded by the following wallet address: ${bundlr.address} \n`);


// Get the Balance of your Bundlr node
async function getNodeBalance(){
    let atomicBalance = await bundlr.getLoadedBalance();
    //console.log(`The native node currency balance is ${atomicBalance}`)
    let convertedAtomicBalance = await bundlr.utils.unitConverter(atomicBalance)
    console.log(`Your bundlr node has a current balance of ${convertedAtomicBalance} ${config.currency}`)
}

// Get Cost estimate in the same currenc
async function getUploadCostEstimate(filePath){
    // If no value is passed into this function, we default to checking the price to upload 1MB of data
    // The function accepts a number of bytes, so to check the price of 1MB, check the price of 1,048,576 bytes.

    const size = await getFileSize(filePath ? filePath : config.default.file.path)
    const {atomicPrice, convertedPrice} = await getUploadPrice(size)
    
    console.log(`It will run you about ${convertedPrice} to upload ${size} bytes of data. \n`)
    return atomicPrice
}

// Add currency to Bundlr Node
async function fundBundlrNode(filePath) {
    const size = await getFileSize()
    const {atomicPrice, convertedPrice} = await getUploadPrice(size)
    try {
        let response = await bundlr.fund(atomicPrice)
        console.log(`Successfully funded ${convertedPrice} ${config.currency} to Bundlr node with transaction id:${response.id}`)
    } catch (error) {
        console.log('Mistakes were made', error)
    }
}

// Upload any arbitraty data
async function uploadData(payload){
    const data = payload ? payload : config.default.payload
    try {
        let response = await bundlr.upload(data)
        console.log(`Successfully upload payload :: ${data} :: to ${config.gateway.main}/${response.id}`)
    } catch (error) {
        console.log("The following mistakes were made:", error)
    }
}

async function uploadFile(fileName, contentType, appName){
    
    const asset = fileName ? fileName : config.default.file.path
    const content = contentType ? contentType : config.default.file.type
    const app = appName ? appName : config.app.name
    const type = path.extname(config.default.file.path)
    const tags = [
        { name: "Content-Type", value: type },
        { name: "appName", value: config.app.name}
    ]

    // check upload fees against wallet balance.  Add funds to wallet to conver upload tx
    if(getUploadCostEstimate(asset) < getNodeBalance){
        console.log("Need more cash. Executing Fund command... \n")
        await fundBundlrNode(fileName)
        console.log("Node now funded for transaction. Initiating Upload now... \n")
    }else {console.log ("funding good")}
    
    try {
        const tx = await bundlr.uploadFile(asset, {
            tags: tags
        })
        console.log(`File uploaded to ${config.env.prod.gateway}/${tx.id}`)
    } catch (error) {
        console.log("The following mistakes were made:", error)
    }
}

// docs: https://docs.bundlr.network/docs/sdk/Basic%20Features/uploading-folder
async function uploadFolder(folderPath){
    const folder = folderPath ? folderPath : config.default.folderPath
    try {
        let response = await bundlr.uploadFolder(folder, {
            indexFile: './index.html', //optional index file (file the user will load when accessing the manifest)
            batchSize: 50, // max number of items to upload at once
            keepDeleted: false // whether to keep now deleted items from previous uploads
        }); // returns the manifest ID
        console.log(`Files uploaded. Manifest Id ${response.id} and you can view your files here: ${config.gateway.main}/${response.id}`);
    } catch (error) {
        console.log(`Mistakes were made: `, error)
    }
}

// await getFileSize()
// await getNodeBalance()
// await getUploadCostEstimate()
// await fundBundlrNode()
// await uploadData()
await uploadFile()
// await uploadFolder()

