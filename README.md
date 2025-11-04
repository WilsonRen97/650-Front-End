# CLIP Album Generation System

## Setup Instructions

1. **Add Images**  
   Download your own images and place them in the `public/images` folder.

2. **Install Node.js**  
   Make sure Node.js is installed on your device. [Download Node.js](https://nodejs.org/)

3. **Generate Image List**  
   Run the following command to generate a JSON file for displaying images in the UI:

   ```sh
   node generateImagesJson.js
   ```

4. **Generate Thumbnails**  
   Run the following command to create thumbnails for faster browser loading:

   ```sh
   node thumbnails.js
   ```

5. **Install Dependencies**  
   Install all required dependencies:

   ```sh
   npm install
   ```

6. **Start the React Project**  
   Start the development server:
   ```sh
   npm start
   ```
