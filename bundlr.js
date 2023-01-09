import Bundlr from "@bundlr-network/client";
import { statSync } from "fs";
import path from 'path';
import config from './bundlr.config.js';
import getFolderSize from 'get-folder-size';


// global configuration variables
const appName = config.app.name
const appVersion = config.app.version
const dataTitle = config.data.title
const dataDescription = config.data.description
const fileTitle = config.file.title
const fileDescription = config.file.description
const folderTitle = config.folder.title
const folderDescription = config.folder.description
const fundAmount = config.fund.amount

if (process.env.NODE_ENV === 'dev') {
    const walletKey = config.wallet.key
    const gateway = config.env.dev.permaweb.gateway
    const permaweb = config.env.dev.permaweb.url
    const currency = config.env.dev.net.currency
    const rpc = config.env.dev.net.rpc
    const blockExplorer = config.env.dev.net.explorer

    // declar async getUploadSize function
    async function getUploadFee(size) {
        return await bundlr.getPrice(size)
    }

    // Connect to a Bundlr Node
    const bundlr = new Bundlr.default(gateway, currency, walletKey, { providerUrl: rpc });
    await bundlr.ready()
    let nodeBalance = await bundlr.getLoadedBalance()
    const convertedNodeBalance = bundlr.utils.unitConverter(nodeBalance)
    console.log(`Your Bundlr Node has a current balance of ${nodeBalance} ${currency} and is funded by wallet address: ${bundlr.address} \n`);

    // Fund Bundlr node
    async function fundBundlrNode(atomicAmount) {
        if (!atomicAmount) {
            console.log("Fund amount required")
            return
        }
        const convertedAmount = await bundlr.utils.unitConverter(atomicAmount)
        try {
            const { id } = await bundlr.fund(atomicAmount)
            let balance = await bundlr.getLoadedBalance()
            let convertedBalance = await bundlr.utils.unitConverter(balance)
            console.log(`Successfully added ${convertedAmount} ${currency} to Bundlr node which has a current balance of ${convertedBalance} . View on blockexplorer: ${blockExplorer}/${id}`)
            return id
        } catch (error) {
            console.log('Mistakes were made', error)
        }
    }

    async function uploadReadinessCheck(size) {
        const uploadFee = await bundlr.getPrice(size)
        const convertedFee = await bundlr.utils.unitConverter(uploadFee)

        //compare upload fee to balance. Add to balance if node insufficiently funded for transaction
        // todo: determine why this evaluation is inverted
        if (uploadFee < nodeBalance) {
            console.log(`It will cost ~ ${convertedFee} ${currency} to upload ${size} bytes of data to the permaweb; however your Bundlr Node has a current balance of ${convertedNodeBalance} ${currency}. Now adding ${convertedFee} ${currency} to your Bundlr Node to cover transaction fees... \n`)
            await fundBundlrNode(uploadFee)
            console.log("Your Bundlr Node is now sufficiently funded for transaction. Executing upload to permaweb now... \n")
        } else {
            console.log(`Fee is ${uploadFee} and Balance is ${nodeBalance}. Funding in order. Executing to permaweb now... \n`)
        }
    }

    //perform data upload to permaweb via Bundlr node
    async function executeDataUploadToPermaweb(payload, size, tags) {
        await uploadReadinessCheck(size)

        try {
            const { id } = await bundlr.upload(payload, { tags: tags });
            console.log(`Your data been uploaded to the permaweb ==> ${permaweb}/${id}`);
            return id
        } catch (e) {
            console.log("Error uploading file ", e);
        }
    }

    //Perform file upload to permaweb via Bundlr node
    async function executeFileUploadToPermaweb(path, size, tags) {
        await uploadReadinessCheck(size)
        try {
            const { id } = await bundlr.uploadFile(path, { tags: tags });
            console.log(`Your file has been uploaded to the permaweb and can be viewed here ==> ${permaweb}/${id}`);
            return id
        } catch (e) {
            console.log("Error uploading file ", e);
        }
    }


    // Perform folder upload to permaweb via Bundlr node
    async function executeFolderUploadToPermaweb(path, size, tags) {
        await uploadReadinessCheck(size)
        try {
            let { id } = await bundlr.uploadFolder(path, {
                //indexFile: './index.html', //optional index file (file the user will load when accessing the manifest)
                batchSize: 50, // max number of items to upload at once
                keepDeleted: false, // whether to keep now deleted items from previous uploads
                tags: tags // folder tags
            }) // returns the manifest ID
            console.log(`Folder successfully uploaded to permaweb with Manifest Id: ${id}.  You can view your folder here ${permaweb}/${id}`)

        } catch (error) {
            console.log(`Mistakes were made: `, error)
        }
    }

    // Upload any arbitraty data
    async function uploadData(payload) {
        const data = payload ? payload : JSON.stringify(config.data.payload)
        const size = Object.keys(config.data.payload).length

        const tags = [
            { name: "Content-Type", value: "application/json" },
            { name: "Title", value: dataTitle },
            { name: "Description", value: dataDescription }
        ]
        await executeDataUploadToPermaweb(data, size, tags)

    }

    async function uploadFile(filePath) {
        const file = filePath ? filePath : config.file.path
        const { size } = statSync(file)
        const contentType = path.extname(file)
        const tags = [
            { name: "App-Name", value: appName },
            { name: "App-Version", value: appVersion },
            { name: "Content-Type", value: `image/${contentType}` },
            { name: "Title", value: fileTitle },
            { name: "Description", value: fileDescription }
        ]
        await executeFileUploadToPermaweb(file, size, tags)
    }

    async function uploadFolder(folderPath) {
        const path = folderPath ? folderPath : config.folder.path
        const size = await getFolderSize.loose(path);
        const tags = [
            { name: "App-Name", value: appName },
            { name: "App-Version", value: appVersion },
            { name: "Title", value: folderTitle },
            { name: "Description", value: folderDescription },
        ]
        await executeFolderUploadToPermaweb(path, size, tags)
    }

    // await getFileSize()
    // await getNodeBalance()
    // await getUploadCostEstimate()
    //await fundBundlrNode(fundAmount)
    // await uploadData()
    await uploadFile()
    //await uploadFolder()
}