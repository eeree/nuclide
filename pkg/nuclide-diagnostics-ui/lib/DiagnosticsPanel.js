'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

const DiagnosticsPane = require('./DiagnosticsPane');
const {Checkbox} = require('../../nuclide-ui/lib/Checkbox');
const {PanelComponent} = require('../../nuclide-ui/lib/PanelComponent');
const {Toolbar} = require('../../nuclide-ui/lib/Toolbar');
const {ToolbarCenter} = require('../../nuclide-ui/lib/ToolbarCenter');
const {ToolbarLeft} = require('../../nuclide-ui/lib/ToolbarLeft');
const {ToolbarRight} = require('../../nuclide-ui/lib/ToolbarRight');
const {React} = require('react-for-atom');
const {PropTypes} = React;
import {
  Button,
  ButtonSizes,
} from '../../nuclide-ui/lib/Button';

import {track} from '../../nuclide-analytics';

let keyboardShortcut: ?string = null;
function getKeyboardShortcut(): string {
  if (keyboardShortcut != null) {
    return keyboardShortcut;
  }

  const matchingKeyBindings = atom.keymaps.findKeyBindings({
    command: 'nuclide-diagnostics-ui:toggle-table',
  });
  if (matchingKeyBindings.length && matchingKeyBindings[0].keystrokes) {
    const {humanizeKeystroke} = require('../../nuclide-keystroke-label');
    keyboardShortcut = humanizeKeystroke(matchingKeyBindings[0].keystrokes);
  } else {
    keyboardShortcut = '';
  }
  return keyboardShortcut;
}

/**
 * Dismissable panel that displays the diagnostics from nuclide-diagnostics-store.
 */
class DiagnosticsPanel extends React.Component {
  static propTypes = {
    diagnostics: PropTypes.array.isRequired,
    height: PropTypes.number.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onResize: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    pathToActiveTextEditor: PropTypes.string,
    filterByActiveTextEditor: PropTypes.bool.isRequired,
    onFilterByActiveTextEditorChange: PropTypes.func.isRequired,
    warnAboutLinter: PropTypes.bool.isRequired,
    disableLinter: PropTypes.func.isRequired,
  };

  constructor(props: mixed) {
    super(props);
    (this: any)._onFilterByActiveTextEditorChange =
      this._onFilterByActiveTextEditorChange.bind(this);
  }

  getHeight(): number {
    return this.refs['panel'].getLength();
  }

  render(): ReactElement {
    let warningCount = 0;
    let errorCount = 0;
    let {diagnostics} = this.props;
    if (this.props.filterByActiveTextEditor && this.props.pathToActiveTextEditor) {
      const pathToFilterBy = this.props.pathToActiveTextEditor;
      diagnostics = diagnostics.filter(diagnostic => diagnostic.filePath === pathToFilterBy);
    }
    diagnostics.forEach(diagnostic => {
      if (diagnostic.type === 'Error') {
        ++errorCount;
      } else if (diagnostic.type === 'Warning') {
        ++warningCount;
      }
    });

    const shortcut = getKeyboardShortcut();
    let shortcutSpan = null;
    if (shortcut !== '') {
      shortcutSpan = (
        <span className="text-subtle inline-block">
          Use <kbd className="key-binding key-binding-sm text-highlight">{shortcut}</kbd> to toggle
          this panel.
        </span>
      );
    }

    let linterWarning = null;
    if (this.props.warnAboutLinter) {
      linterWarning = (
        <Toolbar>
          <ToolbarCenter>
            <span className="inline-block highlight-info">
              nuclide-diagnostics is not compatible with the linter package. We recommend that
              you&nbsp;<a onClick={this.props.disableLinter}>disable the linter package</a>.&nbsp;
              <a href="http://nuclide.io/docs/advanced-topics/linter-package-compatibility/">
              Learn More</a>.
            </span>
          </ToolbarCenter>
        </Toolbar>
      );
    }

    const errorSpanClassName = `inline-block ${errorCount > 0 ? 'text-error' : ''}`;
    const warningSpanClassName = `inline-block ${warningCount > 0 ? 'text-warning' : ''}`;

    // We hide the horizontal overflow in the PanelComponent because the presence of the scrollbar
    // throws off our height calculations.
    return (
      <PanelComponent
        ref="panel"
        dock="bottom"
        initialLength={this.props.height}
        noScroll={true}
        onResize={this.props.onResize}
        overflowX="hidden">
        <div style={{display: 'flex', flex: 1, flexDirection: 'column'}}>
          {linterWarning}
          <Toolbar location="top">
            <ToolbarLeft>
              <span className={errorSpanClassName}>
                Errors: {errorCount}
              </span>
              <span className={warningSpanClassName}>
                Warnings: {warningCount}
              </span>
              <span className="inline-block">
                <Checkbox
                  checked={this.props.filterByActiveTextEditor}
                  label="Show only diagnostics for current file"
                  onChange={this._onFilterByActiveTextEditorChange}
                />
              </span>
            </ToolbarLeft>
            <ToolbarRight>
              {shortcutSpan}
              <Button
                onClick={this.props.onDismiss}
                icon="x"
                size={ButtonSizes.SMALL}
                className="inline-block"
                title="Close Panel"
              />
            </ToolbarRight>
          </Toolbar>
          <DiagnosticsPane
            showFileName={!this.props.filterByActiveTextEditor}
            diagnostics={diagnostics}
            width={this.props.width}
          />
        </div>
      </PanelComponent>
    );
  }

  _onFilterByActiveTextEditorChange(isChecked: boolean) {
    track('diagnostics-panel-toggle-current-file', {isChecked: isChecked.toString()});
    this.props.onFilterByActiveTextEditorChange.call(null, isChecked);
  }
}

module.exports = DiagnosticsPanel;
