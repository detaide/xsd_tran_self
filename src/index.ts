import { tranFile } from "./utils/TranFile";
import {generateAuth} from "./utils/tencent_auth"
import {TencentTranClient} from "./utils/tencent_tran";
import dotenv from 'dotenv';

function setup()
{
    dotenv.config();
}


function main()
{
    setup()
    tranFile()
    // console.log(process.argv.slice(2))
    // TencentTranClient.TextTran("Digest Value da NF-e processada. Utilizado para conferir a integridade da NF-e original.");
    // console.log(process.env.TENCENTCLOUD_SECRET_ID)
}



main()