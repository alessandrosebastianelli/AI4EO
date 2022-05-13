
/*
  Code for NDVI mapping with Sentinel-2 data.

  Alessandro Sebastianelli, sebastianelli@unisannio.it or alessandro.sebastianelli1995@gmail.com
*/

// Load the Sentinel-2 catalog
var S2 = ee.ImageCollection('COPERNICUS/S2')
// Filter the data by start and end date
.filterDate('2018-01-01', '2018-12-30')
// Filter the data using a polygon
.filterBounds(geometry);

var maskcloud1 = function(image) {
  var QA60 = image.select(['QA60']);
  return image.updateMask(QA60.lt(1));
};

// Function for NDVI calculation
var addNDVI = function(image) {
  return image.addBands(image.normalizedDifference(['B8', 'B4']));
};

// For each image in the catalog, add a new band called 'nd' that contains the NDVI
var S2 = S2.map(addNDVI);
// Create a new catalog by selecting the NDVI bands from the previous
var NDVI = S2.select(['nd']);

// Calculate the temporal mean using the images in the NDVI catalog
var NDVImed = NDVI.mean(); 

// Add the NDVI map to the world map
Map.addLayer(NDVImed.clip(geometry), visParams_ndvi, 'NDVI');

// Set some parameteres for the plot
var visParams_ndvi = {min: -0.2, max: 0.8, palette: 'FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400,' +
    '3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301'};

// Plot a chart using the band 'nd' of catalog S2 and appyling a geometry mean
var plotNDVI = ui.Chart.image.seriesByRegion(S2, geometry,ee.Reducer.mean(),
'nd',500,'system:time_start', 'system:index')
              .setChartType('LineChart').setOptions({
                title: 'NDVI short-term time series',
                hAxis: {title: 'Date'},
                vAxis: {title: 'NDVI'}
});

// Plot the chart
print(plotNDVI);


