'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import FileTreeActions from '../lib/FileTreeActions';
import {FileTreeNode} from '../lib/FileTreeNode';
import {DirectoryEntryComponent} from '../components/DirectoryEntryComponent';
import {FileEntryComponent} from '../components/FileEntryComponent';
import {WorkingSet} from '../../nuclide-working-sets';
import Immutable from 'immutable';

import {
  React,
  ReactDOM,
  TestUtils,
} from 'react-for-atom';

function renderEntryComponentIntoDocument(
  componentKlass: Object,
  props: Object = {},
  conf: Object = {}
): void {
  const nodeProps = {
    isExpanded: false,
    isLoading: false,
    isSelected: false,
    isCwd: false,
    ...props,
  };

  const nodeConf = {
    vcsStatuses: {},
    workingSet: new WorkingSet(),
    editedWorkingSet: new WorkingSet(),
    hideIgnoredNames: true,
    excludeVcsIgnoredPaths: true,
    ignoredPatterns: new Immutable.Set(),
    repositories: new Immutable.Set(),
    usePreviewTabs: true,
    isEditingWorkingSet: false,
    openFilesWorkingSet: new WorkingSet(),
    reposByRoot: {},
    ...conf,
  };

  const node = new FileTreeNode(nodeProps, nodeConf);
  return TestUtils.renderIntoDocument(React.createElement(componentKlass, {node}));
}

describe('DirectoryEntryComponent', () => {
  const actions = FileTreeActions.getInstance();

  describe('when expanding/collapsing dir component', () => {
    beforeEach(() => {
      spyOn(actions, 'expandNode');
    });

    it('expands on click when node is selected', () => {
      const nodeComponent = renderEntryComponentIntoDocument(
        DirectoryEntryComponent,
        {
          rootUri: '/a/',
          uri: '/a/b/',
          isSelected: true,
        }
      );

      // The onClick is listened not by the <li> element, but by its first child.
      const domNode = ReactDOM.findDOMNode(nodeComponent).children[0];
      TestUtils.Simulate.click(domNode);
      expect(actions.expandNode).toHaveBeenCalled();
    });
  });
});

describe('FileEntryComponent', () => {
  const actions = FileTreeActions.getInstance();

  describe('when expanding/collapsing file component', () => {
    beforeEach(() => {
      spyOn(actions, 'expandNode');
    });

    it('does not expand on click when node is selected', () => {
      const nodeComponent = renderEntryComponentIntoDocument(
        FileEntryComponent,
        {
          rootUri: '/a/',
          uri: '/a/b',
          isSelected: true,
        }
      );
      const domNode = ReactDOM.findDOMNode(nodeComponent);
      TestUtils.Simulate.click(domNode);
      expect(actions.expandNode).not.toHaveBeenCalled();
    });
  });

  describe('when preview tabs are enabled', () => {
    beforeEach(() => {
      spyOn(actions, 'confirmNode');
    });

    it('opens a file if a selected node is clicked', () => {
      const nodeComponent = renderEntryComponentIntoDocument(
        FileEntryComponent,
        {
          rootUri: '/a/',
          uri: '/a/b',
          isSelected: true,
          usePreviewTabs: true,
        },
      );
      const domNode = ReactDOM.findDOMNode(nodeComponent);
      TestUtils.Simulate.click(domNode);
      expect(actions.confirmNode).toHaveBeenCalled();
    });
  });

});
