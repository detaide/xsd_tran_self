import * as tencentcloud from "tencentcloud-sdk-nodejs-tmt";

const TmtClient = tencentcloud.tmt.v20180321.Client;

// 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
// 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考，建议采用更安全的方式来使用密钥，请参见：https://cloud.tencent.com/document/product/1278/85305
// 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取


export class TencentTranClient
{
    private clientConfig = null;
    public static clientInstance = null;
    public client = null;
    public count = 0;
    public batchFinishSign = false;
    public promiseQueue = [];
    public timer = null;
    public zeroCount = 0;


    constructor()
    {
        this.clientConfig = {
            credential: {
                secretId: process.env.TENCENTCLOUD_SECRET_ID ,
                secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
            },
            region: "ap-guangzhou",
            profile: {
                httpProfile: {
                endpoint: "tmt.tencentcloudapi.com",
                },
            },
        };

        // 实例化要请求产品的client对象,clientProfile是可选的
        this.client = new TmtClient(this.clientConfig);
        this.timer = setInterval(() => {
            (this.count == 0) && (this.zeroCount++);
            (this.count != 0) && (this.zeroCount = 0);
            this.count = 0;
            // console.log("clear", this.count);
            (this.zeroCount == 3) && (this.clearInterval())
        }, 2000)
    }

    public static create()
    {
        return this.getClientInstance();
    }

    public getClient()
    {
        this.client = this.client ?? new TmtClient(this.clientConfig);
        return this.client;
    }

    static getClientInstance()
    {
        this.clientInstance = this.clientInstance ?? new TencentTranClient();
        return this.clientInstance;
    }

    async TextTran(text? : string) : Promise<TencentTranResponse>
    {
        
        await new Promise(async (resolve) =>
        {
            // await this.simulatorRequest();
            // resolve({});
            const checkCount = () =>
            {
                // console.log("block", this.count)
                if(this.count >= 5)
                {
                    setTimeout(checkCount, 1000)
                }else{
                    resolve({});
                }
            }
            checkCount()
        })

        this.count++;
        // console.log("lock get", this.count);
        // await this.simulatorRequest();
        // console.log("running")
        
        const params = {
            "SourceText": text,
            "Source": "auto",
            "Target": "zh",
            "ProjectId": 0
        };

        let resp = {};
        try{
            console.log("tran text : ", text);
            resp = await this.client.TextTranslate(params) as unknown as TencentTranResponse;
        }
        catch(err)
        {
            console.log(err);
            console.log("catch error ,retry again");
        }finally{
            return resp;
        }

    }

    public async clearInterval()
    {
        if(this.timer)
            clearInterval(this.timer);
        return Promise.resolve();
    }


    async simulatorRequest()
    {
        let waitTime = Math.random() * 2000;
        await new Promise((resolve => setTimeout(() =>
            {
            //    console.log(this.count);
                resolve(null);
            }, waitTime)))
    }

}

export interface TencentTranResponse
{
    RequestId? : string,
    Source? : string,
    Target? : string,
    TargetText? : string
}

export const chunkAndPromise = (taskList : Array<(...args) => Promise<any>>, chunkSize : number, timeGap : number) =>
    {
        let queueChunks = [];
        // if(chunkSize === 1)
        // {
            // queueChunks = taskList;
        // }else{
        for (let i = 0; i < taskList.length; i += chunkSize) {
            queueChunks.push(taskList.slice(i, i + chunkSize));
        }
        // }
        
        let currentChunkIndex = 0;
        let taskResult = [];
        
        function executeChunk() {
            
            const currentChunk = queueChunks[currentChunkIndex];
            return Promise.all(currentChunk.map(task => task()))
            .then(results => {
                taskResult.push(results);
                currentChunkIndex++;
                if (currentChunkIndex < queueChunks.length) {
                    console.log("Next Task Start");
                    return new Promise((resolve, reject) => 
                    {
                        setTimeout(() => {
                            executeChunk().then(resolve).catch(reject)
                        }, timeGap * 1000)
                    })
                } else {
                    console.log('Queue execution completed');
                }
            })
        }
        return executeChunk()
        .finally(() =>
        {
            return taskList;
        })
        
    }