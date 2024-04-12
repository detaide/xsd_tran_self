export function argvRead() : ArgvType
{
    let argMap : ArgvType = {};
    let argList = process.argv.slice(2);
    if(!argList || !argList.length)
        return;

    argList.forEach((item) =>
    {
        let file_reg = /-+(.*)=(.*)/g
        // let split = item.match(file_reg);
        let matchList = file_reg.exec(item);
        if(matchList && matchList[1] && matchList[2])
        {
            argMap[matchList[1]] = matchList[2];
        }
    })
    return argMap;
}


export interface ArgvType
{
    file? : string
}