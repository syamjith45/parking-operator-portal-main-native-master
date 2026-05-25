/**
 * Generates an HTML string for a 58mm thermal printer receipt.
 * Used with expo-print's printAsync({ html }) on both iOS and Android.
 *
 * @param {'entry'|'exit'} type
 * @param {object} vehicle   - vehicle entry record
 * @param {object} exitData  - { actualDuration, declaredDuration, totalCost, balanceDue, overstayHours }
 * @param {object} organization - { name }
 */
export function generateReceiptHtml({ type = 'exit', vehicle, exitData, organization }) {
  const isEntry = type === 'entry';

  const fmt = (d) =>
    new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const now = fmt(new Date().toISOString());
  const entryTime = vehicle?.entry_time ? fmt(vehicle.entry_time) : '—';
  const exitTime = isEntry ? null : now;

  const normalizedType = vehicle?.vehicle_type?.toLowerCase() || '';
  const isCar =
    normalizedType === 'car' ||
    normalizedType.includes('four_wheeler') ||
    normalizedType.includes('four-wheeler');
  const displayType = isCar ? 'Car' : 'Bike';

  const orgName = organization?.name || 'PARKING RECEIPT';
  const plate = vehicle?.vehicle_number || 'NO PLATE';
  const phone = vehicle?.driver_phone || '';
  const basePaid = vehicle?.base_fee_paid || 0;

  const overstayRow =
    !isEntry && exitData?.overstayHours > 0
      ? `<tr>
           <td>Overstay (${exitData.overstayHours}h):</td>
           <td class="right">&#8377;${exitData.totalCost - basePaid}</td>
         </tr>`
      : '';

  const exitRows = !isEntry && exitData
    ? `${overstayRow}
       <tr class="bold border-top">
         <td>Total Cost:</td>
         <td class="right">&#8377;${exitData.totalCost}</td>
       </tr>
       <tr class="bold large">
         <td>Balance Paid:</td>
         <td class="right">&#8377;${exitData.balanceDue}</td>
       </tr>`
    : '';

  const duration = isEntry
    ? `${vehicle?.declared_duration_hours || 0}h (Booked)`
    : `${exitData?.actualDuration || 0}h`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    width: 58mm;
    padding: 4mm;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .large { font-size: 15px; }
  .xl { font-size: 20px; font-weight: bold; }
  .upper { text-transform: uppercase; }
  .dash { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  .border-top td { border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
  .header { margin-bottom: 8px; }
  .footer { margin-top: 8px; font-size: 10px; }
</style>
</head>
<body>

<div class="center header">
  <div class="bold upper" style="font-size:14px">${orgName}</div>
  <div class="bold upper" style="font-size:12px; margin-top:4px">
    ${isEntry ? 'Entry Slip' : 'Exit Receipt'}
  </div>
</div>

<div class="dash"></div>

<div class="xl">${plate}</div>
<table style="margin-top:4px">
  <tr>
    <td>Type:</td>
    <td class="right">${displayType}</td>
  </tr>
  ${phone ? `<tr><td>Phone:</td><td class="right">${phone}</td></tr>` : ''}
</table>

<div class="dash"></div>

<table>
  <tr>
    <td class="bold">IN:</td>
    <td class="right">${entryTime}</td>
  </tr>
  ${!isEntry ? `<tr><td class="bold">OUT:</td><td class="right">${exitTime}</td></tr>` : ''}
  <tr>
    <td class="bold">Duration:</td>
    <td class="right">${duration}</td>
  </tr>
</table>

<div class="dash"></div>

<table>
  <tr>
    <td>Paid Upfront:</td>
    <td class="right">&#8377;${basePaid}</td>
  </tr>
  ${exitRows}
</table>

<div class="dash"></div>

<div class="center footer">
  <div class="bold">DRIVE SAFELY!</div>
  <div style="margin-top:4px">Generated: ${now}</div>
  <div style="margin-top:2px">Powered by KeraAI Mobility</div>
</div>

</body>
</html>`;
}
