import path, { resolve } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs/promises';
import sendWebhook from '../utilities/send_webhook.js';

dotenv.config({ path: resolve('../../.env') });


/**
 * @fetchStock - This function fetches stock data from the API and sends a webhook to Discord. 
 * @param {*} product_sku - The product SKU to fetch stock for from user input.
 * @returns  - Sends a webhook to Discord with the stock data.
 */
async function fetchStock(product_sku) {
  try {
    // Fetch API data
    const url = process.env.api;
    const response = await axios.get(url);
    const data = response.data.objects;
    
    // Collecting product photo
    const dataNode = data.flatMap(item => item.publishedContent?.nodes || []);
    let productPhoto = '';
    for (const node of dataNode) {
      const altText = node.properties?.altText || '';
      if (altText.includes(product_sku)) {
        productPhoto = node.properties?.portraitURL || 'No URL found'; // Fixed from productPhoto
        break;
      }
    }
    console.log("Product photo:", productPhoto);



    // get product that matched sku
    const productInfo = data.flatMap(item =>
      item.productInfo && Array.isArray(item.productInfo) ? item.productInfo : []
    );

    let filteredProducts = [];
    // collect product info
    try {
      filteredProducts = productInfo.filter(product =>
        product.availability?.available === true &&
        product.merchProduct?.status === 'ACTIVE' &&
        product.merchProduct?.styleColor === product_sku
      );
    } catch (error) {
      console.error("Error filtering products:", error);
    }

    // exit early if no products found
    if (filteredProducts.length === 0) {
      console.log("Product stock has not been loaded yet!, try again nearby release time.");
      return; 
    }


    // Collecting data
    const productTitle = filteredProducts.map(product => product.merchProduct.labelName);
    const productSKU = filteredProducts.map(product => product.merchProduct.styleCode);
    const releaseMethod = filteredProducts.map(product => product.merchProduct.channels);

    // Calculate sizeWithStockNumber
    const sizeWithStockNumber = [];
    for (const product of filteredProducts) { // Using for...of for clarity
      for (const sku of product.skus) {
        const gtin = product.availableGtins.find(g => g.gtin === sku.gtin);
        if (gtin) {
          for (const spec of sku.countrySpecifications) {
            sizeWithStockNumber[spec.localizedSize] = gtin.level;
          }
        }
      }
    }
    
    // Send webhook with all data collected
    try {
      await sendWebhook(productTitle, productSKU, releaseMethod, sizeWithStockNumber, productPhoto);
      console.log("Webhook sent successfully!");
    } catch (webhookError) {
      console.error("Error sending webhook:", webhookError);
    }

  } catch (error) {
    console.log("Product not found or error occurred!");
    console.error("Unable to fetch and save:", error);
  }
}

// Run the function
fetchStock();