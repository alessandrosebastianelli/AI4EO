/*
  Code for Volcanic eruption detection
  Alessandro Sebastianelli, sebastianelli@unisannio.it or alessandro.sebastianelli1995@gmail.com
*/

// Set the coordinates for centering the map on the area of interest
var lat =  14.99
var lon =  37.76
Map.setCenter(lat, lon, 13);

// Set the period of interest
var date = ee.Filter.date('2018-12-23', '2018-12-25')

// Load the Sentinel-2 catalog
var s2dataset = ee.ImageCollection('COPERNICUS/S2')
                  // Filter the catalog by start and end date
                  .filter(date)
                  // Filter the catalog by area of interest
                  .filterBounds(geometry)
                  // Set the order of images by the oldest to the newest
                  .sort('system:time_start', true);
              
// Settings for images visualization
var rgbVis = {
  min: 0.0,
  max: 10000
};

// Function to apply to each image of the catalog
function addS2Image(img){

  // Create the image by using the id and selecting the bands
  var image = ee.Image(img.id).select(['B4', 'B3', 'B2', 'B11', 'B12']).toUint16();
  console.log(image)
  
  // Create the image name
  var s2_name = 'S2-lat_'+lat.toString().replace('.','_')+'_lon_'+lon.toString().replace('.','_')+'-'+image.date().format('yyyy-MM-dd').getInfo();
  var name = s2_name.toString();
  
  // Create the new red band by using mathematical expression
  var red_new = image.expression(
    '2.5 * RED + IR*0.7', {
      'RED': image.select('B4'),
      'IR': image.select('B12')
  });
  
  // Create the new green band by using mathematical expression
  var green_new = image.expression(
    '2.5 * GREEN + IR*0.7', {
      'GREEN': image.select('B3'),
      'IR': image.select('B11')
  });
  
  // Create the new blue band by using mathematical expression
  var blue_new = image.expression(
    '2.5 * BLUE', {
      'BLUE': image.select('B2')
  });
  
  // Create a new image with the new bands
  var IR_Highlighted = ee.Image.cat([red_new, green_new, blue_new])
  .select(
    ['constant', 'constant_1', 'constant_2'], // old names
    ['RED', 'GREEN', 'BLUE']               // new names
  );

  // Add the "normal" image to the map (subset with geometry)
  Map.addLayer(image.clip(geometry), rgbVis, name);

  // Add the new image to the map (subset with geometry)
  Map.addLayer(IR_Highlighted.clip(geometry), rgbVis, name);
}

// Loop on each image in the catalog
s2dataset.evaluate(function(s2dataset){
  // For each image apply the function addS2Image
  s2dataset.features.map(addS2Image)
})