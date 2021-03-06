'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {DiffModeType} from './types';
import type {NuclideUri} from '../../nuclide-remote-uri';

import classnames from 'classnames';
import {DiffMode} from './constants';
import {React} from 'react-for-atom';
import {
  Button,
} from '../../nuclide-ui/lib/Button';
import {
  ButtonGroup,
  ButtonGroupSizes,
} from '../../nuclide-ui/lib/ButtonGroup';
import {Toolbar} from '../../nuclide-ui/lib/Toolbar';
import {ToolbarCenter} from '../../nuclide-ui/lib/ToolbarCenter';
import {ToolbarLeft} from '../../nuclide-ui/lib/ToolbarLeft';
import {ToolbarRight} from '../../nuclide-ui/lib/ToolbarRight';

type Props = {
  diffMode: DiffModeType;
  filePath: NuclideUri;
  newRevisionTitle: ?string;
  oldRevisionTitle: ?string;
  onSwitchToEditor: () => mixed;
  onSwitchMode: (mode: DiffModeType) => mixed;
};

class DiffViewToolbar extends React.Component {
  props: Props;

  render(): ReactElement {
    const {diffMode, filePath} = this.props;
    const hasActiveFile = filePath != null && filePath.length > 0;
    const modes = Object.keys(DiffMode).map(modeId => {
      const modeValue = DiffMode[modeId];
      const className = classnames({
        'selected': modeValue === diffMode,
      });
      return (
        <Button
          key={modeValue}
          className={className}
          onClick={() => this.props.onSwitchMode(modeValue)}>
          {modeValue}
        </Button>
      );
    });

    return (
      <Toolbar location="top">
        <ToolbarLeft>
          <ButtonGroup size={ButtonGroupSizes.SMALL}>
            {modes}
          </ButtonGroup>
        </ToolbarLeft>
        <ToolbarCenter>
          {this.props.oldRevisionTitle == null ? '?' : this.props.oldRevisionTitle}
          {'...'}
          {this.props.newRevisionTitle == null ? '?' : this.props.newRevisionTitle}
        </ToolbarCenter>
        <ToolbarRight>
          <ButtonGroup size={ButtonGroupSizes.SMALL}>
            <Button
              disabled={!hasActiveFile}
              onClick={this.props.onSwitchToEditor}>
              Goto Editor
            </Button>
          </ButtonGroup>
        </ToolbarRight>
      </Toolbar>
    );
  }
}

module.exports = DiffViewToolbar;
