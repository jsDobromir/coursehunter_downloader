import request from 'request';
import cheerio from 'cheerio';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import https from 'https';
import mkdirp from 'mkdirp';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const courseUrl = process.argv[2];
const pathDownload = process.argv[3];

async function downloadFile(title,url){
    const extName = path.extname(url);
    const fileName = title + extName;
    const download = pathDownload ? pathDownload : __dirname;
    const file =  fs.createWriteStream(path.join(download,fileName));
    return new Promise(async (resolve,reject) => {
        
            https.get(url,function(response){
                
                    response.pipe(file);
                    console.log(`Downloading ${fileName}`);
                file.on('finish',() => {
                    file.close();
                    return resolve();
                })
                .on('error',(err) => {
                    console.log(err);
                    return reject(err);
                })
            })
    });
}

request(courseUrl,async function(error,response,html){
    if(!error && response.statusCode===200){
        const $ = cheerio.load(html);
        const scr = $('script')[0];
        const keys = Object.keys(scr);
        const obj = scr.children[0];
        const data = JSON.parse(obj.data);
        const graphObjKey = Object.keys(data)[1];
        console.log(data[graphObjKey]);
        const promises = [];
        if(pathDownload){
            try{
                await mkdirp(pathDownload);
            }catch(err){
                console.log('Error creating the folder where you want to download\nPlease try different');
                process.exit(1);
            }
        }
        for(let videoObj of data[graphObjKey]){
            let title = videoObj.name.replace(/\s/g,'-');
            title = title.replace(/\\|\//g,'');
            promises.push(downloadFile(title,videoObj.url));
        }
        console.log(`Download in proccess...`);
        try{
            await Promise.all(promises);
            console.log('Donwload completed,enjoy the course');
        }
        catch(err){
            console.log(`Unfortunatly error happened : ${err}`);
        }
    }
    else{
        console.log(`There was error getting data from this url,please double check it`);
        process.exit(1);
    }
})