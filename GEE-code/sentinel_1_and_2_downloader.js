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
  
  return [[elon, nlat], [wlon, nlat], [wlon, slat], [elon, slat]];
}

//--------------------------------- USER VARs ----------------------------------
var lon = point.coordinates().get(0).getInfo()
var lat = point.coordinates().get(1).getInfo()

var start_date = '2019-08-15';
var end_date =   '2019-09-20';

var folder = 'lake';
var export_name = 's2_'+folder+'_';

var sizeinkm = 10
var zoom = 13


// YYYY-MM-DD
var date = ee.Filter.date(start_date, end_date)
var polygon = get_coordinates_square(lat, lon, sizeinkm);
var geometry = ee.Geometry.Polygon(polygon);
Map.setCenter(lon, lat, zoom);
//Map.addLayer(geometry);


var s1dataset = ee.ImageCollection('COPERNICUS/S1_GRD_FLOAT')
        .filterBounds(geometry)
        .filter(date)
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
        //.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
        .sort('system:time_start', true)
        .select(['VV', 'VH']);

// Map the function over one year of data and take the median.
// Load Sentinel-2 TOA reflectance data.
var s2dataset = ee.ImageCollection('COPERNICUS/S2')
                  .filter(date)
                  .filterBounds(geometry)
                  .sort('system:time_start', true);
                  //.select(['B4', 'B3', 'B2']);
                  
var rgbVis = {
  min: 0.0,
  max: 5000,
  bands: ['B4', 'B3', 'B2'],
};

//Map.addLayer(s1dataset.median().clip(geometry).toDouble(), {min: [-25], max: [10]});
//Map.addLayer(s2dataset.median().clip(geometry).toDouble(), rgbVis);


//var s2_name = 'S2-lat_'+lat.toString().replace('.','_')+'-lon_'+lon.toString().replace('.','_')+'-'+start_date;
//var export_name = s2_name.toString();


/*
Export.image.toDrive({
    image: s2dataset.median().clip(geometry).toDouble(),
    description: 's2',
    fileNamePrefix: export_name, 
    folder:folder,
    scale: 10,
    fileFormat: 'GeoTIFF',
    region: geometry,
  });

//var s1_name = 'S1-lat_'+lat.toString().replace('.','_')+'-lon_'+lon.toString().replace('.','_')+'-'+start_date;
//var export_name = s1_name.toString();
var export_name = 's1_'+folder+'_';

Export.image.toDrive({
    image: s1dataset.(0).clip(geometry).toDouble(),
    description: 's1',
    fileNamePrefix: export_name, 
    folder:folder,
    scale: 10,
    fileFormat: 'GeoTIFF',
    region: geometry,
  });
  
*/  
function addS2Image(img){
  var id = img.id;
  //var image = ee.Image(img.id).toDouble();//.toUint16();//.select(['B4', 'B3', 'B2']).toUint16();
  //var image = ee.Image(img.id).select(['B4', 'B3', 'B2']).toDouble();//.toUint16();//.select(['B4', 'B3', 'B2']).toUint16();
  var image = ee.Image(img.id).toDouble();//.toUint16();//.select(['B4', 'B3', 'B2']).toUint16();

  console.log(image)
  
  var s2_name = 'S2-lat_'+lat.toString().replace('.','_')+'_lon_'+lon.toString().replace('.','_')+'-'+image.date().format('yyyy-MM-dd').getInfo();
  var name = s2_name.toString();
  
  Export.image.toDrive({
    image: image,
    description: name,
    fileNamePrefix: name, 
    folder:"gee_data",
    scale: 10,
    fileFormat: 'GeoTIFF',
    region: geometry,
  });
  
  Map.addLayer(image.clip(geometry), rgbVis, id);
  //Map.addLayer(image, rgbVis, id);
}

function addS1Image(img){
  var id = img.id;
  var image = ee.Image(img.id).select(['VV', 'VH']);
  
  var s1_name = 'S1-lat_'+lat.toString().replace('.','_')+'_lon_'+lon.toString().replace('.','_')+'-'+image.date().format('yyyy-MM-dd').getInfo();
  var name = s1_name.toString();
  console.log(image)
  
  Export.image.toDrive({
    image: image,
    description: name,
    fileNamePrefix: name, 
    folder:"gee_data",
    scale: 10,
    fileFormat: 'GeoTIFF',
    region: geometry,
  });
  
  
  Map.addLayer(image.clip(geometry), {min: [0,0], max:[1,1]}, id);// {min: [-25, -25], max: [10, 10]}, id);
}


s2dataset.evaluate(function(s2dataset){
  s2dataset.features.map(addS2Image)
})


s1dataset.evaluate(function(s1dataset){
  s1dataset.features.map(addS1Image)
})


