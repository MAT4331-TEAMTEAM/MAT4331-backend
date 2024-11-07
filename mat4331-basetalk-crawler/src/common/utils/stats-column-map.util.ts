import { BatInfo } from '../types/bat-info.type';
import { PitchInfo } from '../types/pitch-info.type';

export const batColumnMap = new Map<number, keyof BatInfo>([
  [0, 'PA'],
  [1, 'AB'],
  [2, 'R'],
  [3, 'H'],
  [4, 'HR'],
  [5, 'RBI'],
  [6, 'BB'],
  [7, 'HBP'],
  [8, 'SO'],
  [9, 'GO'],
  [10, 'FO'],
  [11, 'NP'],
  [12, 'GDP'],
  [13, 'LOB'],
  [14, 'ABG'],
  [15, 'OPS'],
  [16, 'LI'],
  [17, 'WPA'],
  [18, 'RE24'],
]);

export const pitchColumnMap = new Map<number, keyof PitchInfo>([
  [0, 'IP'],
  [1, 'TBF'],
  [2, 'H'],
  [3, 'R'],
  [4, 'ER'],
  [5, 'BB'],
  [6, 'HBP'],
  [7, 'K'],
  [8, 'HR'],
  [9, 'GO'],
  [10, 'FO'],
  [11, 'NP'],
  [12, 'S'],
  [13, 'IR'],
  [14, 'IS'],
  [15, 'GSC'],
  [16, 'ERA'],
  [17, 'WHIP'],
  [18, 'LI'],
  [19, 'WPA'],
  [20, 'RE24'],
]);