/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// Portions of the code in this file are based on code from ICU.
// Original licensing can be found in the NOTICE file in the root directory of this source tree.

import {AnyCalendarDate} from '../types';
import {CalendarDate} from '../CalendarDate';
import {GregorianCalendar, gregorianToJulianDay} from './GregorianCalendar';

const MS_PER_DAY = 86400000;
const VIKRAM_SAMVAT_EPOCH = -1789990200000;

const VIKRAM_YEAR_ZERO = 1970;

const ENCODED_MONTH_LENGTHS = [
  0x511aba, 0x5117ba, 0x9056ee, 0x8456ed, 0x511aba, 0x5119fa, 0x9056ee, 0x8456ed, 0x511aba, 0x5116fa, // 1970-1979
  0x9056ee, 0x514aea, 0x511aba, 0x5116fa, 0x9056ee, 0x514aea, 0x511aba, 0x5116ee, 0x9056ee, 0x511aea, // 1980-1989
  0x511aba, 0x5116ee, 0x8456ee, 0x511aea, 0x511aba, 0x5056ee, 0x8456ee, 0x511aba, 0x511aba, 0x9056ee, // 1990-1999
  0x8456ed, 0x511aba, 0x5116fa, 0x9056ee, 0x8456ed, 0x511aba, 0x5116fa, 0x9056ee, 0x814aea, 0x511aba, // 2000-2009
  0x5116fa, 0x9056ee, 0x514aea, 0x511aba, 0x5116fa, 0x9056ee, 0x514aea, 0x511aba, 0x5116ee, 0x8456ee, // 2010-2019
  0x511aea, 0x511aba, 0x5056ee, 0x8456ee, 0x511aea, 0x511aba, 0x9056ee, 0x8456ed, 0x511aba, 0x5117ba, // 2020-2029
  0x9056ee, 0x8456ed, 0x511aba, 0x5116fa, 0x9056ee, 0x814aed, 0x511aba, 0x5116fa, 0x9056ee, 0x514aea, // 2030-2039
  0x511aba, 0x5116fa, 0x9056ee, 0x514aea, 0x511aba, 0x5116ee, 0x9056ee, 0x511aea, 0x511aba, 0x5056ee, // 2040-2049
  0x8456ee, 0x511aea, 0x511aba, 0x5056ee, 0x8456ee, 0x511aba, 0x5117ba, 0x9056ee, 0x8456ed, 0x511aba, // 2050-2059
  0x5116fa, 0x9056ee, 0x844aed, 0x511aba, 0x5116fa, 0x9056ee, 0x814aea, 0x511aba, 0x5116fa, 0x9056ee, // 2060-2069
  0x514aea, 0x511aba, 0x5116ee, 0x9056ee, 0x511aea, 0x511aba, 0x5056ee, 0x8456ee, 0x511aea, 0x511aba, // 2070-2079
  0x5056ee, 0x5456ee, 0x5456ed, 0x5456ba, 0x5456ba, 0x5459ee, 0x5456ed, 0x545aba, 0x5459f9, 0x5456ed, // 2080-2089
  0x5456ed,                                                                                           // 2090
]

function _getDaysInMonth(year: number, month: number) {
  if (month < 1 || month > 12) throw new Error('Invalid month value: ' + month);

  const delta = ENCODED_MONTH_LENGTHS[year - VIKRAM_YEAR_ZERO];
  if(typeof delta === 'undefined') throw new Error('No data for year: ' + year + ' BS');

  return 29 + ((delta >>> (((month-1) << 1))) & 3);
}

/**
 * The Vikram Samvat Calendar is a historical Hindu calendar used in the Indian subcontinent and Nepal.
 * Years are counted from 57 BCE. The calendar is primarily used in Nepal and among Hindus
 * in North India. Only one era identifier is supported: 'vikram'.
 */
export class VikramSamvatCalendar extends GregorianCalendar {
  identifier = 'vikram';

  fromJulianDay(jd: number): CalendarDate {
    // Gregorian date for Julian day
    let date = super.fromJulianDay(jd);

    var m, dM, year = VIKRAM_YEAR_ZERO, days = Math.floor((Date.parse(date.toString()) - VIKRAM_SAMVAT_EPOCH) / MS_PER_DAY) + 1;

    while(days > 0) {
      for(m=1; m<=12; ++m) {
        dM = _getDaysInMonth(year, m);
        if(days <= dM) return new CalendarDate(this, year, m, days);
        days -= dM;
      }
      ++year;
    }

    throw new Error('Date outside supported range: ' + jd + ' AD');
  }

  toJulianDay(date: AnyCalendarDate) {
    if (date.year < VIKRAM_YEAR_ZERO) throw new Error('Invalid year value: ' + date.year);
    if (date.day < 1 || date.day > _getDaysInMonth(date.year, date.month)) throw new Error('Invalid day value: ' + date.day);

    let timestamp = VIKRAM_SAMVAT_EPOCH + (MS_PER_DAY * date.day);


    let {year, month, day} = date;

    month -= 1;

    while (year >= VIKRAM_YEAR_ZERO) {
      while (month > 0) {
        timestamp += (MS_PER_DAY * _getDaysInMonth(year, month));
        month--;
      }
      month = 12;
      year--;
    }

    const jsdate = new Date(timestamp);

    return gregorianToJulianDay('AD', jsdate.getUTCFullYear(), jsdate.getUTCMonth() + 1, jsdate.getUTCDate());
  }

  getDaysInMonth(date: AnyCalendarDate): number {
    return _getDaysInMonth(date.year, date.month);
  }

  getYearsInEra(): number {
    return VIKRAM_YEAR_ZERO + ENCODED_MONTH_LENGTHS.length - 1;
  }

  getEras() {
    return ['BS'];
  }

  balanceDate() {}
}
