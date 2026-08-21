const fs = require('fs');

const path = process.argv[2];
if (!path) {
  console.error('Usage: node fix.js <path-to-main.jsx>');
  process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');
let changes = 0;

function apply(label, oldStr, newStr) {
  if (content.includes(oldStr)) {
    content = content.split(oldStr).join(newStr);
    console.log('APPLIED: ' + label);
    changes++;
  } else {
    console.log('SKIPPED (pattern not found, may already be fixed): ' + label);
  }
}

// 1. Initial-load useEffect
apply(
  'initial-load useEffect (assets/supplies -> requesterItemSearch)',
  "  useEffect(() => {\n    pcmsApi.assets({ limit: 200 }).then(setAssetsList).catch((err) => setError(err.message));\n    pcmsApi.departments().then(setDepartmentsList).catch(() => {});\n    pcmsApi.supplies({ limit: 200 }).then(setSuppliesList).catch(() => {});\n  }, []);",
  "  useEffect(() => {\n    // Requesters are not authorized for /api/assets or /api/supplies (403 Forbidden).\n    // Use the role-safe requester catalog endpoint instead for the initial preload.\n    pcmsApi.departments().then(setDepartmentsList).catch(() => {});\n    pcmsApi.requesterItemSearch('', { limit: 200 })\n      .then((results) => {\n        const catalog = results || [];\n        setAssetsList(catalog.filter((entry) => entry.item_type === 'asset'));\n        setSuppliesList(catalog.filter((entry) => entry.item_type === 'supply'));\n      })\n      .catch((err) => setError(err.message));\n  }, []);"
);

// 2. Recommendations effect: supply.stock -> supply.available_quantity
apply(
  'recommendations effect (supply.stock -> supply.available_quantity)',
  "} else if (supply && qty > Number(supply.stock || 0)) {\n        next.push({ type: 'inventory_limit', severity: 'high', message: `${supply.name} has ${supply.stock} unit(s) available.` });\n      }",
  "} else if (supply && qty > Number(supply.available_quantity || 0)) {\n        next.push({ type: 'inventory_limit', severity: 'high', message: `${supply.name} has ${supply.available_quantity} unit(s) available.` });\n      }"
);

// 3. Gate Pass asset select
apply(
  'Gate Pass asset select (id -> source_id)',
  "{assetsList.filter((asset) => ['assigned', 'available', 'issued'].includes(asset.status || 'available')).map((asset) => <option key={asset.id} value={asset.id}>{asset.name} / {asset.property_number} / {asset.serial_number || 'No serial'}</option>)}",
  "{assetsList.map((asset) => <option key={asset.source_id} value={asset.source_id}>{asset.name} / {asset.category} / {asset.status}</option>)}"
);

// 4. Request Summary asset detail lookup
apply(
  'Request Summary asset detail lookup (id -> source_id)',
  "<td>{assetsList.find((asset) => String(asset.id) === String(form.asset_id))?.name || 'Select asset'}</td>\n                      <td>{assetsList.find((asset) => String(asset.id) === String(form.asset_id))?.serial_number || 'N/A'}</td>\n                      <td>{assetsList.find((asset) => String(asset.id) === String(form.asset_id))?.property_number || 'N/A'}</td>\n                      <td>{assetsList.find((asset) => String(asset.id) === String(form.asset_id))?.custodian_id || 'Recorded custodian'}</td>",
  "<td>{assetsList.find((asset) => String(asset.source_id) === String(form.asset_id))?.name || 'Select asset'}</td>\n                      <td>{assetsList.find((asset) => String(asset.source_id) === String(form.asset_id))?.description || 'N/A'}</td>\n                      <td>{assetsList.find((asset) => String(asset.source_id) === String(form.asset_id))?.category || 'N/A'}</td>\n                      <td>{assetsList.find((asset) => String(asset.source_id) === String(form.asset_id))?.current_custodian || 'Recorded custodian'}</td>"
);

fs.writeFileSync(path, content, 'utf8');
console.log('\nDone. ' + changes + ' of 4 patterns applied.');
