import {argvRead} from "../general";
import fs from "fs";
import path from "path";
import { TencentTranClient } from "../tencent_tran";

const tran_save_folder = path.resolve('./saveFile')
let absolute_base = '';

export async function tranFile()
{

    let arg_obj = argvRead();
    let file = arg_obj.file;
    if(!file)
        throw new Error("文件路径为空");
    if(path.isAbsolute(file))
        absolute_base = file;

    fs.access(tran_save_folder, fs.constants.F_OK, async (err) =>
    {
        if(err)
            await fs.mkdirSync(tran_save_folder)
        await TranFolderHandle(file);
        // await TencentTranClient.create().clearInterval();
    })
}

export async function ResolveFilePath(__path : string)
{

    let absolutePath = path.isAbsolute(__path) ? __path : path.resolve(__path);
    // console.log(__path, absolutePath);
    let stat = fs.statSync(absolutePath);
    let isDir = stat.isDirectory();

    return {isDir, absolutePath};
}

export async function TranFolderHandle(__path : string) {
    let {isDir, absolutePath} = await ResolveFilePath(__path);
    let savePath = tran_save_folder + '/' + (isDir ? __path.substring(absolute_base.length) : path.basename(absolutePath)) ;
    // console.log(isDir, savePath, absolutePath);
    if(!isDir)
    {
        if(__path.endsWith('.xsd'))
        {
            await TranFileHandle(absolutePath, savePath);
        }
        return;
    }
    
    
    fs.access(savePath, fs.constants.F_OK, async (err) =>
    {
        if(err)
            await fs.mkdirSync(savePath);

        fs.readdir(absolutePath, async (err, files) =>
        {
            files.forEach((file) =>
            {
                TranFolderHandle(__path + '/' + file);
            })
        })
    })

}

/**
 * 读取文件翻译，保存到新的文件内
 * @param file 
 */
export async function TranFileHandle(absolutePath : string, saveDir : string) {

    let newFile = fs.createWriteStream(saveDir);

    fs.readFile(absolutePath, 'utf-8', async (err, data) =>
    {
        if(err) throw err;
        let fileLine = data.split('\n');
        
        for(const line of fileLine)
        {
            let xsd_documentation_reg = /(\t+)(<xs:documentation>)(.*)(<\/xs:documentation>)/g;
            let match_documentation = xsd_documentation_reg.exec(line);
            // console.log(line);
            newFile.write(line + '\n');
            if(!match_documentation || !match_documentation[3])
            {
                continue;
            }
            let resp = await TencentTranClient.create().TextTran(match_documentation[3])
            await newFile.write(`${match_documentation[1]}<!-- ${match_documentation[2] + resp.TargetText + match_documentation[4]} -->\n`)
            continue;
        }
    })
}
