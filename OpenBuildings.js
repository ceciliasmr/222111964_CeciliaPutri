// 1. Tentukan kode provinsi target (ID32 = Jawa Barat)
var targetProvinsi = "ID35";

// 3. Filter hanya kabupaten/kota dalam provinsi target
var kabupatenTarget = admin.filter(ee.Filter.eq('ADM1_PCODE', targetProvinsi));

// 4. Load data bangunan Google Open Buildings dengan confidence ≥ 0.75
var buildings = ee.FeatureCollection('GOOGLE/Research/open-buildings/v3/polygons')
  .filter(ee.Filter.gte('confidence', 0.75));

// 5. Tambahkan luas ke tiap poligon bangunan
var buildingsWithArea = buildings.map(function(f) {
  return f.set('area_m2', f.geometry().area(1));
});

// 6. Loop untuk setiap kabupaten/kota
var results = kabupatenTarget.map(function(region) {
  var geom = region.geometry();
  var kodeKab = region.get('ADM2_PCODE');
  var kodeProv = region.get('ADM1_PCODE');
  var namaKab = region.get('ADM2_EN');  
  var luasWilayah = geom.area(1);

  var bangunanDalam = buildingsWithArea.filterBounds(geom);
  var totalLuasBangunan = bangunanDalam.aggregate_sum('area_m2');
  var persentase = ee.Number(totalLuasBangunan).divide(luasWilayah).multiply(100);

  return ee.Feature(null, {
    ADM1_PCODE: kodeProv,
    ADM2_PCODE: kodeKab,
    nama_kabupaten: namaKab,
    luas_bangunan_m2: totalLuasBangunan,
    luas_wilayah_m2: luasWilayah,
    persentase_bangunan: persentase
  });
});

// 7. Tampilkan hasil di console (opsional)
print('Hasil luas bangunan per kabupaten:', results);

// 8. Ekspor ke Google Drive
Export.table.toDrive({
  collection: results,
  description: 'luas_bangunan_per_kabupaten_' + targetProvinsi,
  fileFormat: 'CSV'
});

