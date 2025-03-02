import path, { resolve } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';


dotenv.config({ path: resolve('../../.env') });

const product_sku = "HV0823-003"

async function fetchStock(product_sku){
    try{
        const url = process.env.api;
        const response = await axios.get(url);
        const data = response.data.objects;

        // Flatten and filter in one go
        const filteredProducts = data
            .flatMap(item => (item.productInfo && Array.isArray(item.productInfo) ? item.productInfo : []))
            .filter(product => product.availability?.available === true && product.merchProduct?.status === 'ACTIVE' && product.styleColor === product_sku)
            .map(product => ({
                productName: product.merchProduct.labelName,
                launchView: product.launchView,
                availableGtins: product.availableGtins,
            }));
        
        
        const filePath = path.resolve('../data/snkrs_data3.json');
        await fs.writeFile(filePath, JSON.stringify(filteredProducts, null, 2));
        console.log('File written successfully');


        //TODO
        // 1. Filter every productInfo
        // 2. Check to narrow down productInfo with availability and status true/ACTIVE
        // 3. Execute the search to the product with name/SKU or whatever is the best

    } catch(e){
        console.log("Product not found !");
        console.error("Unable fetch and save",e);
    }
}


fetchStock();