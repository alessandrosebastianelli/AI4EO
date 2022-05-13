/*
  Code for downloading paired Sentinel-2 and Sentinel-1 data
  Alessandro Sebastianelli, sebastianelli@unisannio.it or alessandro.sebastianelli1995@gmail.com
*/

var EARTH_RADIUS  = 6271.0
var DEGREES_TO_RADIANS = 3.1415/180.0
var RADIANS_TO_DEGREE = 180.0/3.1415

function change_in_latitude(kms){
  return (kms/EARTH_RADIUS)*RADIANS_TO_DEGREE;
}

function change_in_longitude(latitude, kms){
    var r = EARTH_RADIUS*Math.cos(latitude*DEGREES_TO_RADIANS)
    return (kms/r)*RADIANS_TO_DEGREE;
}

function get_coordinates_square(latitude, longitude, size){

  var  half_size = size/2;

  var  slat = latitude+change_in_latitude(-half_size);
  var  nlat = latitude+change_in_latitude(half_size);
  var  wlon = longitude+change_in_longitude(latitude, -half_size);
  var  elon = longitude+change_in_longitude(latitude, half_size);
  
  return [[wlon, nlat], [elon, nlat], [wlon, slat], [elon, slat]];
}

var lon = 14.7781600
var lat = 41.1307000
var date = ee.Filter.date('2016-06-07', '2016-06-20')
var sizeinkm = 20

var zoom = 13



var polygon = get_coordinates_square(lat, lon, sizeinkm);
var geometry = ee.Geometry.Polygon(polygon);
Map.setCenter(lon, lat, zoom);


var s1dataset = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(geometry)
        .filter(date)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
        .sort('system:time_start', true)
        .select(['VV', 'VH']);

// Map the function over one year of data and take the median.
// Load Sentinel-2 TOA reflectance data.
var s2dataset = ee.ImageCollection('COPERNICUS/S2')
                  .filter(date)
                  .filterBounds(geometry)
                  .sort('system:time_start', true);
                  
var rgbVis = {
  min: 0.0,
  max: 10000,
  bands: ['B4', 'B3', 'B2'],
};


function addS2Image(img){
  var id = img.id;
  var image = ee.Image(img.id).select(['B4', 'B3', 'B2']).toUint16();
  console.log(image)
  
  var s2_name = 'S2-lat_'+lat.toString().replace('.','_')+'_lon_'+lon.toString().replace('.','_')+'-'+image.date().format('yyyy-MM-dd').getInfo();
  var name = s2_name.toString();
  
  Export.image.toDrive({
    image: image,
    description: 'dataset',
    fileNamePrefix: name, 
    folder:"gee_data",
    scale: 10,
    fileFormat: 'GeoTIFF',
    region: geometry,
  });
  
  Map.addLayer(image, rgbVis, id);
}

function addS1Image(img){
  var id = img.id;
  var image = ee.Image(img.id).select(['VV', 'VH']);
  
  var s1_name = 'S1-lat_'+lat.toString().replace('.','_')+'_lon_'+lon.toString().replace('.','_')+'-'+image.date().format('yyyy-MM-dd').getInfo();
  var name = s1_name.toString();
  console.log(image)
  
  Export.image.toDrive({
    image: image,
    description: 'dataset',
    fileNamePrefix: name, 
    folder:"gee_data",
    scale: 10,
    fileFormat: 'GeoTIFF',
    region: geometry,
  });
  
  
  Map.addLayer(image, {min: [-25, -25], max: [10, 10]}, id);
}


s2dataset.evaluate(function(s2dataset){
  s2dataset.features.map(addS2Image)
})


s1dataset.evaluate(function(s1dataset){
  s1dataset.features.map(addS1Image)
})



