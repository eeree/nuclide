'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {JSXClosingElement} from 'ast-types-flow';
import type {Lines, Print} from '../../types/common';

const flatten = require('../../utils/flatten');
const markers = require('../../constants/markers');

function printJSXClosingElement(print: Print, node: JSXClosingElement): Lines {
  return flatten([
    '</',
    markers.noBreak,
    print(node.name),
    markers.noBreak,
    '>',
  ]);
}

module.exports = printJSXClosingElement;
