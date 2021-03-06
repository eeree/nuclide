# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the license found in the LICENSE file in
# the root directory of this source tree.

from clang.cindex import *
from utils import location_dict, range_dict
import logging
import os

logger = logging.getLogger(__name__)


def get_declaration_location_and_spelling(translation_unit, absolute_path, line, column):
    def log(s):
        logger.info('%s:%d:%d - %s',
                    os.path.basename(absolute_path), line, column, s)

    source_location = translation_unit.get_location(
        absolute_path, (line, column))
    cursor = Cursor.from_location(translation_unit, source_location)
    if cursor is None:
        log('No cursor')
        return None

    # Don't allow clicks/tooltips on most declarations, as their content is usually obvious.
    # Make an exception for variable declarations, as these can often have auto types.
    if cursor.kind != CursorKind.VAR_DECL and cursor.kind.is_declaration():
        log('Ignoring declaration')
        return None

    referenced = cursor.referenced
    if referenced is None or referenced.location is None or referenced.location.file is None:
        log('No referenced information')
        return None

    loc = referenced.location
    log('Returning {0}:{1}:{2}'.format(
        os.path.basename(loc.file.name), loc.line, loc.column))

    # An extent has a `start` and `end` property, each of which have a `line`
    # and `column` property.
    extent = cursor.extent

    type = None
    try:
        type = cursor.type and cursor.type.spelling
    except:
        logger.warn('Was not able to get cursor type')
        pass

    location = location_dict(loc)
    location['spelling'] = cursor.spelling
    location['type'] = type
    location['extent'] = range_dict(extent)
    return location
