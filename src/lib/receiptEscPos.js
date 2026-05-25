// ESC/POS command constants
const ESC = '\x1B';

const INIT         = `${ESC}\x40`;          // Initialize printer
const ALIGN_LEFT   = `${ESC}\x61\x00`;
const ALIGN_CENTER = `${ESC}\x61\x01`;
const FONT_NORMAL  = `${ESC}\x21\x00`;
const FONT_BOLD_ON = `${ESC}\x45\x01`;
const FONT_BOLD_OFF= `${ESC}\x45\x00`;
const FONT_DOUBLE  = `${ESC}\x21\x30`;      // Double width + height
const FEED_LINES   = `${ESC}\x64\x04`;      // Feed 4 lines before cut
const CUT          = `${ESC}\x69`;          // Full cut

const LINE_WIDTH = 32; // characters per line on 58mm paper

const col2 = (left, right, width = LINE_WIDTH) => {
  const l = String(left);
  const r = String(right);
  const spaces = Math.max(1, width - l.length - r.length);
  return l + ' '.repeat(spaces) + r + '\n';
};

export const printReceiptEscPos = async ({ type = 'exit', vehicle, exitData, organization, device }) => {
  const isEntry = type === 'entry';

  const fmt = (d) =>
    new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const now = fmt(new Date().toISOString());
  const entryTime = vehicle?.entry_time ? fmt(vehicle.entry_time) : '-';
  const exitTime  = isEntry ? null : now;

  const normalizedType = vehicle?.vehicle_type?.toLowerCase() || '';
  const isCar = normalizedType === 'car' || normalizedType.includes('four');
  const displayType = isCar ? 'Car' : 'Bike';

  const orgName  = organization?.name || 'PARKING RECEIPT';
  const plate    = vehicle?.vehicle_number || 'NO PLATE';
  const phone    = vehicle?.driver_phone || '';
  const basePaid = vehicle?.base_fee_paid || 0;
  const duration = isEntry
    ? `${vehicle?.declared_duration_hours || 0}h (Booked)`
    : `${exitData?.actualDuration || 0}h`;

  const divider = '--------------------------------\n';

  let data = INIT;

  // Header
  data += ALIGN_CENTER;
  data += FONT_BOLD_ON + orgName.toUpperCase() + '\n' + FONT_BOLD_OFF;
  data += (isEntry ? 'ENTRY SLIP' : 'EXIT RECEIPT') + '\n';
  data += ALIGN_LEFT + divider;

  // Plate number (large)
  data += ALIGN_CENTER + FONT_DOUBLE + plate + '\n' + FONT_NORMAL;
  data += ALIGN_LEFT;

  // Vehicle details
  data += col2('Type:', displayType);
  if (phone) data += col2('Phone:', phone);
  data += divider;

  // Times
  data += col2('IN:', entryTime);
  if (!isEntry) data += col2('OUT:', exitTime || '-');
  data += col2('Duration:', duration);
  data += divider;

  // Financials
  data += col2('Paid Upfront:', `Rs.${basePaid}`);
  if (!isEntry && exitData) {
    if (exitData.overstayHours > 0) {
      data += col2(`Overstay(${exitData.overstayHours}h):`, `Rs.${exitData.totalCost - basePaid}`);
    }
    data += divider;
    data += FONT_BOLD_ON + col2('Total Cost:', `Rs.${exitData.totalCost}`) + FONT_BOLD_OFF;
    data += col2('Balance Paid:', `Rs.${exitData.balanceDue}`);
  }

  data += divider;

  // Footer
  data += ALIGN_CENTER;
  data += FONT_BOLD_ON + 'DRIVE SAFELY!\n' + FONT_BOLD_OFF;
  data += `Generated: ${now}\n`;
  data += 'Powered by KeraAI Mobility\n';
  data += FEED_LINES + CUT;

  await device.write(data);
};
