import path, { resolve } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';


dotenv.config({ path: resolve('../../.env') });

async function fetchStock(){
    try{

        const url = process.env.api;
        const response = await axios.get(url);
    
        const data = response.data.objects;

        const filteredProducts = data
        .flatMap(item => (item.productInfo && Array.isArray(item.productInfo) ? item.productInfo : []))
        .filter(product => product.availability?.available === true && product.merchProduct?.status === 'ACTIVE')
        .map(product => ({
            launchView: product.launchView,
            availableGtins: product.availableGtins,
        }));

        const filePath = path.resolve("../data/snkrs_data2.json");
    
        await fs.writeFile(filePath, JSON.stringify(filteredProducts, null, 2));
    
        console.log("File written successfully");
    } catch(e){
        console.error("Unable fetch and save",e);
    }

}


fetchStock();