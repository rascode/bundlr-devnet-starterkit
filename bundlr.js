import Bundlr from "@bundlr-network/client";
import { statSync } from "fs";
import path from 'path';
import config from './bundlr.config.js';
import getFolderSize from 'get-folder-size';


async function getFileSize(filePath){
    const pathToFile = filePath ? filePath : config.file.path
    const {size} = statSync(pathToFile)
    return size
}

async function getUploadFee(uploadSize){
    const size = uploadSize ? uploadSize : config.default.dataSize
    const atomicUploadFee = await bundlr.getPrice(size)
    const convertedUploadFee = bundlr.utils.unitConverter(atomicUploadFee)
    return {atomicUploadFee, convertedUploadFee}
}

// Connect to a Bundlr Node
const bundlr = new Bundlr.default(config.env.dev.gateway, config.env.dev.currency, config.wallet.key, { providerUrl: config.env.dev.rpc});
await bundlr.ready()

console.log(`Your Bundlr node is funded by the following wallet address: ${bundlr.address} \n`);


// Get Bundlr node balance
async function getNodeBalance(){
    let atomicNodeBalance = await bundlr.getLoadedBalance();
    let convertedAtomicBalance = await bundlr.utils.unitConverter(atomicNodeBalance)
    console.log(`Your bundlr node has a current balance of ${convertedAtomicBalance} ${config.env.dev.currency}`)
    return atomicNodeBalance
}

// Fund Bundlr node
async function fundBundlrNode(size) {
    const {atomicUploadFee, convertedUploadFee} = await getUploadFee(size)
    try {
        let tx = await bundlr.fund(atomicUploadFee)
        console.log(`Successfully added ${convertedUploadFee} ${config.currency} to Bundlr node. View on blockexplorer: http://myblock/${tx.id}`)
        return convertedUploadFee
    } catch (error) {
        console.log('Mistakes were made', error)
    }
}

//perform data upload to permaweb via Bundlr node
async function executeDataUploadToPermaweb(payload, tags){
    try {
        let tx = await bundlr.upload(payload, {tags: tags});
        console.log(`Your data been uploaded to the permaweb ==> https://arweave.net/${tx.id}`);
        return tx.id
    } catch (e) {
        console.log("Error uploading file ", e);
    }
}

//Perform file upload to permaweb via Bundlr node
async function executeFileUploadToPermaweb(file, tags){
    try {
        let tx = await bundlr.uploadFile(file, {tags: tags});
        console.log(`Your file has been uploaded to the permaweb ==> https://arweave.net/${tx.id}`);
        return tx.id
    } catch (e) {
        console.log("Error uploading file ", e);
    }
}

// Perform folder upload to permaweb via Bundlr node
async function executeFolderUploadToPermaweb(){

}



// Upload any arbitraty data
async function uploadData(payload){
    const data = payload ? payload : JSON.stringify(config.data.payload)
    const tags = [{name: "Content-Type", value: "application/json"}]
    executeDataUploadToPermaweb(data, tags);
}

async function uploadFile(filePath){
    
    //declare variables
    const file = filePath ? filePath : config.file.path
    const fileSize = await getFileSize(file)
    const { atomicUploadFee } = await getUploadFee(fileSize)
    const atomicNodeBalance = await getNodeBalance() 
    
    //define permaweb tags
    const tags = [
        { name: "App-Name", value: config.app.name },
        { name: "App-Version", value: config.app.version},
        { name: "Content-Type", value: path.extname(file)},
        { name: "Title", value: config.file.title},
        { name: "Description", value: config.file.description}
    ]

    //compare upload fee to balance. Add to balance if node insufficiently funded for transaction
    if(atomicUploadFee > atomicNodeBalance){
        console.log("Need more cash. Executing Fund command... \n")
        await fundBundlrNode(fileSize)
        console.log("Node now funded for transaction. Initiating Upload now... \n")
    } else {
        console.log ("Funding ok. Proceeding to upload folder to permaweb \n")
    }

    //perform file upload to permaweb
    await executeFileUploadToPermaweb(file, tags)
    
}

async function uploadFolder(folderPath){

    //declare variables
    const folder = folderPath ? folderPath : config.folder.path
    const folderSize = await getFolderSize.loose(folder);
    const uploadCost = await getUploadCostEstimate(folderSize)
    const nodeBalance = await getNodeBalance()
    
    //define permaweb tags
    const tags = [
        { name: "App-Name", value: config.app.name},
        { name: "App-Version", value: config.app.version},
        { name: "Title", value: config.folder.title},
        { name: "Description", value: config.folder.description},
    ]

    //compare upload fee to balance. Add to balance if node insufficiently funded for transaction
    if (uploadCost > nodeBalance) {
        console.log (`Bundlr Node balance insufficient to cover upload.  Funding node from wallet ${bundlr.address} \n`)
        const fundAmount = await fundBundlrNode(folderSize)
        console.log(`Funded Bundlr node with ${fundAmount} ${config.env.currency}. Uploading folder to permaweb now...`)
    }

    try {
        let tx = await bundlr.uploadFolder(folder, {
            //indexFile: './index.html', //optional index file (file the user will load when accessing the manifest)
            batchSize: 50, // max number of items to upload at once
            keepDeleted: false, // whether to keep now deleted items from previous uploads
            tags: tags // folder tags
        }) // returns the manifest ID
        console.log(`Folder successfully uploaded to permaweb with Manifest Id: ${tx.id}.  You can view your folder here ${config.env.prod.gateway}/${tx.id}`)
        //todo: determine how to automatically load the index.html file from the root path of the manifest file.

    } catch (error) {
        console.log(`Mistakes were made: `, error)
    }
}

// await getFileSize()
// await getNodeBalance()
// await getUploadCostEstimate()
//await fundBundlrNode()
await uploadData()
//await uploadFile()
//await uploadFolder()
