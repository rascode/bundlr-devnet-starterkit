import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

export default {
    title: "This is my title",
    description: "and my description",
    permaweb_url: "https://arweave.net",
    wallet: {
        key: process.env.WALLET_KEY
    },
    app: {
        name: "Bundlr Demo",
        version: "0.1.1",
        contentType: "text/html"
    },
    env: {
        dev: {
            permaweb: {
                gateway: "https://devnet.bundlr.network",
                url: "https://arweave.net"
            },
            net: {
                currency: "matic",
                rpc: "https://rpc-mumbai.maticvigil.com",
                explorer: "https://mumbai.polygonscan.com"
            }
        },
        test: {
            gateway: "",
            currency: "",
            rpc: ""
        },
        prod:
        {
            gateway: "https://arweave.net",
            net: {
                currency: "matic",
                rpc: "matic-rpc.com",
                explorer: ""
            }
        }
    },
    data: {
        path: "./src/assets/payload.json",
        payload: {
            hello: "mastermind",
            you: "are already well on your way",
            to: "becoming an Arweave Zen Master",
            dont: "give up now",
            keep: "going until you reach the finish line",
            remeber: "to reach out for help if you get stuck",
            us: "devs have to stick together",
            and: "remember",
            no: {
                person: {
                    is: {
                        an: "island"
                    }
                }
            }
        },
        title: "Demo Bundlr network data set",
        description: "This is an example of what it looks like to upload a data object/payload to the arweave permaweb via the Bundlr Development network",
    },
    file: {
        path: "./src/assets/majestic.jpeg",
        title: "Demo Bundlr Network File",
        description: "This is an example of what it looks like to upload a single image to the arweave permaweb using the Bundlr Development network"
    },
    folder: {
        path: "./src/assets/collection",
        title: "Demo Bundlr Network Folder",
        description: "This is an example folder upload to the arweave permaweb using the Bundlr Development network",
        contentType: "text/html"
    },
    fund: {
        amount: 4_442_242
    }
}