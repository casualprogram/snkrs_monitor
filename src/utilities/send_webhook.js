import axios from 'axios';
import FormData from 'form-data';
import { resolve } from 'path';
import delay from '../utilities/delay.js';
import dotenv from 'dotenv';

dotenv.config({ path: resolve('../../.env') });

/**
 * @description  - This function sends messages to TinTang community.
 * @param {*} headline : The headline of the story.
 * @param {*} imageURL : The image of story.
 * @param {*} postUrl  : The URL of the story.
 */
export default async function sendWebhook(productTitle, productSKU, releaseMethod, sizeWithStockNumber, productPhoto) {
  // The Discord webhook
  const webhookUrl = process.env.DISCORD_WEBHOOK;


  try {
    // Create embed structure object message to send to Discord

    const sizeString = Object.entries(sizeWithStockNumber)
      .map(([size, level]) => `${size}: ${level}`)
      .join('\n');
    const formattedSizeString = `\`\`\`\n${sizeString}\n\`\`\``; // Wrap the size string in a code block

    const embed = {
      title: `${productTitle}`,
      color: 5763719,
      author: {
        name: '7tinh Hub News',
        icon_url: 'https://media.discordapp.net/attachments/1303904551417413642/1343342344086224906/image.png?ex=67bcec8c&is=67bb9b0c&hm=eb9327c9c3e61e714d710a34c2f64dc5506452adb696ffe6420503200d634ef2&=&format=webp&quality=lossless&width=653&height=278',
        url: 'https://www.youtube.com/@ttintang',
      },      
      image: {
        url: productPhoto,
      },
      fields: [
        {
          name: "SKU",
          value: `${productSKU}`,
          inline: false,
        },
        {
          name: "Release Method",
          value: `${releaseMethod}`,
          inline: false,
        },
        {
          name: "Stock Loaded",
          value: formattedSizeString || "No stock information available",
        }
      ],

      footer: {
        text: 'powered by Casual Solutions',
        icon_url: 'https://pbs.twimg.com/profile_images/1398475007584444418/GRPcs63v_400x400.jpg',
      },
      timestamp: new Date().toISOString(),
    };

    // Create a FormData object to send the embed message
    const formData = new FormData();
    // Append the embed object as a stringified JSON
    formData.append('payload_json', JSON.stringify({ embeds: [embed] }));

    // Send the webhook message
    const response = await axios.post(webhookUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Log the remaining requests and the rate limit reset time
    const remainingRequests = response.headers['x-ratelimit-remaining'];
    const resetTime = response.headers['x-ratelimit-reset'];
    console.log(`Remaining requests: ${remainingRequests}`);
    console.log(`Rate limit resets at: ${new Date(resetTime * 1000)}`);

    // If the remaining requests are 0, we are being rate limited by Discord
    if (remainingRequests === '0') {
      const retryAfter = response.headers['retry-after'];
      console.log(`Rate limited! Retrying after ${retryAfter} milliseconds.`);
      await delay(retryAfter); // Wait for the time specified in the `Retry-After` header
    }



    
  } catch (error) {
    // If the error is a 429 (rate limit exceeded) error
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.log(`Rate limited! Retry after ${retryAfter} milliseconds.`);
      await delay(retryAfter); // Wait for the specified time before retrying
      await sendWebhook(headline, imageURL, postUrl); // Retry the webhook after waiting
    } else {
      // Log the error if it is not a rate limit error
      console.error('Error sending webhook:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
    }
  }
}


