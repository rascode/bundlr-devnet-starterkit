import Bundlr from "@bundlr-network/client";
import { statSync } from "fs";
import path from 'path';
import config from './bundlr.config.js';


async function getFileSize(filePath){
    const pathToFile = filePath ? filePath : config.file.path
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
const bundlr = new Bundlr.default(config.env.dev.gateway, config.env.dev.currency, config.wallet.key, { providerUrl: config.env.dev.rpc});
await bundlr.ready()

console.log(`Your Bundlr node is funded by the following wallet address: ${bundlr.address} \n`);


// Get the Balance of your Bundlr node
async function getNodeBalance(){
    let atomicBalance = await bundlr.getLoadedBalance();
    let convertedAtomicBalance = await bundlr.utils.unitConverter(atomicBalance)
    console.log(`Your bundlr node has a current balance of ${convertedAtomicBalance} ${config.currency}`)
}

// Get Cost estimate in the same currenc
async function getUploadCostEstimate(filePath){
    const size = await getFileSize(filePath ? filePath : config.file.path)
    const {atomicPrice, convertedPrice} = await getUploadPrice(size)
    
    console.log(`It will cost you about ${convertedPrice} to upload ${size} bytes of data. \n`)
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
    const data = payload ? payload : JSON.stringify(config.default.data.payload)
    const tags = [{name: "Content-Type", value: "application/json"}]
    try {
        let tx = await bundlr.upload(data, {tags: tags})
        console.log(`Successfully upload payload :: ${data} :: to ${config.env.prod.gateway}/${tx.id}`)
    } catch (error) {
        console.log("The following mistakes were made:", error)
    }
}

async function uploadFile(fileName, contentType, appName){
    
    const file = fileName ? fileName : config.file.path

    const tags = [
        { name: "App-Name", value: appName ? appName : config.app.name },
        { name: "App-Version", value: config.app.version},
        { name: "Content-Type", value: path.extname(file)},
        { name: "Title", value: config.file.title},
        { name: "Description", value: config.file.description}
    ]
    // check upload fees against wallet balance.  Add funds to wallet to conver upload tx
    if(getUploadCostEstimate(file) < getNodeBalance){
        console.log("Need more cash. Executing Fund command... \n")
        await fundBundlrNode(file)
        console.log("Node now funded for transaction. Initiating Upload now... \n")
    }else {console.log ("funding ok")}
    
    try {
        const tx = await bundlr.uploadFile(file,{ tags:tags } )
        console.log(`File uploaded to ${config.env.prod.gateway}/${tx.id}`)
    } catch (error) {
        console.log("The following mistakes were made:", error)
    }
}

async function uploadFolder(folderPath){
    const payload = folderPath ? folderPath : config.folder.path

    const tags = [
        { name: "App-Name", value: config.app.name},
        { name: "App-Version", value: config.app.version},
        { name: "Title", value: config.folder.title},
        { name: "Description", value: config.folder.description},
    ]

    try {
        let tx = await bundlr.uploadFolder(payload, {
            indexFile: './index.html', //optional index file (file the user will load when accessing the manifest)
            batchSize: 50, // max number of items to upload at once
            keepDeleted: false, // whether to keep now deleted items from previous uploads
            tags: tags // folder tags
        }) // returns the manifest ID
        console.log(`Folder uploaded successfully with Manifest Id: ${tx.id}.  You can view your folder here${config.env.prod.gateway}/${tx.id}`)
        //todo: determine how to automatically load the index.html file from the root path of the manifest file.

    } catch (error) {
        console.log(`Mistakes were made: `, error)
    }
}

// await getFileSize()
// await getNodeBalance()
// await getUploadCostEstimate()
// await fundBundlrNode()
//await uploadData()
//await uploadFile()
 await uploadFolder()

