'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

const {CompositeDisposable} = require('atom');
const {EventEmitter} = require('events');
const {LazyTreeNode} = require('./LazyTreeNode');
const {TreeNodeComponent} = require('./TreeNodeComponent');
const {forEachCachedNode} = require('./tree-node-traversals');
const {
  React,
  ReactDOM,
} = require('react-for-atom');

const {PropTypes} = React;

type TreeMenuItemDefinition = {
  label: string;
  command: string;
  submenu: ?Array<TreeMenuItemDefinition>;
  shouldDisplay: ?() => boolean;
  shouldDisplayForSelectedNodes: ?(nodes: Array<LazyTreeNode>) => boolean;

  // By default, no context menu item will be displayed if the tree is empty.
  // Set this to true to override that behavior.
  shouldDisplayIfTreeIsEmpty: ?boolean;
};

type TreeComponentState = {
  expandedNodeKeys: Array<string>;
  selectedNodeKeys: Array<string>;
};

/**
 * Toggles the existence of a value in a set. If the value exists, deletes it.
 * If the value does not exist, adds it.
 *
 * @param set The set whose value to toggle.
 * @param value The value to toggle in the set.
 * @param [forceHas] If defined, forces the existence of the value in the set
 *     regardless of its current existence. If truthy, adds `value`, if falsy
 *     deletes `value`.
 * @returns `true` if the value was added to the set, otherwise `false`. If
 *     `forceHas` is defined, the return value will be equal to `forceHas`.
 */
function toggleSetHas(
    set: Set<string>,
    value: string,
    forceHas?: ?boolean
): boolean {
  let added;

  if (forceHas || (forceHas === undefined && !set.has(value))) {
    set.add(value);
    added = true;
  } else {
    set.delete(value);
    added = false;
  }

  return added;
}

const FIRST_SELECTED_DESCENDANT_REF: string = 'firstSelectedDescendant';

/**
 * Generic tree component that operates on LazyTreeNodes.
 */
export const TreeRootComponent = React.createClass({
  _allKeys: (null: ?Array<string>),
  _emitter: (null: ?EventEmitter),
  _keyToNode: (null: ?{[key: string]: LazyTreeNode}),
  _rejectDidUpdateListenerPromise: (null: ?() => void),
  _subscriptions: (null: ?CompositeDisposable),

  propTypes: {
    initialRoots: PropTypes.arrayOf(PropTypes.instanceOf(LazyTreeNode)).isRequired,
    eventHandlerSelector: PropTypes.string.isRequired,
    // A node can be confirmed if it is a selected non-container node and the user is clicks on it
    // or presses <enter>.
    onConfirmSelection: PropTypes.func.isRequired,
    // A node can be "kept" (opened permanently) by double clicking it. This only has an effect
    // when the `usePreviewTabs` setting is enabled in the "tabs" package.
    onKeepSelection: PropTypes.func.isRequired,
    labelClassNameForNode: PropTypes.func.isRequired,
    rowClassNameForNode: PropTypes.func.isRequired,
    // Render will return this component if there are no root nodes.
    elementToRenderWhenEmpty: PropTypes.element,
    initialExpandedNodeKeys: PropTypes.arrayOf(PropTypes.string),
    initialSelectedNodeKeys: PropTypes.arrayOf(PropTypes.string),
  },

  getDefaultProps(): any {
    return {
      elementToRenderWhenEmpty: null,
      onConfirmSelection(node: LazyTreeNode) {},
      rowClassNameForNode(node: LazyTreeNode) { return ''; },
    };
  },

  getInitialState(): any {
    const rootKeys = this.props.initialRoots.map(root => root.getKey());

    let selectedKeys;
    if (this.props.initialSelectedNodeKeys) {
      selectedKeys = new Set(this.props.initialSelectedNodeKeys);
    } else {
      selectedKeys = new Set(rootKeys.length === 0 ? [] : [rootKeys[0]]);
    }

    return {
      roots: this.props.initialRoots,
      // This is maintained as a set of strings for two reasons:
      // (1) It is straightforward to serialize.
      // (2) If the LazyFileTreeNode for a path is re-created, this will still work.
      expandedKeys: new Set(this.props.initialExpandedNodeKeys || rootKeys),
      selectedKeys,
    };
  },

  componentDidUpdate(prevProps: Object, prevState: ?Object): void {
    // If the Set of selected items is new, like when navigating the tree with
    // the arrow keys, scroll the first item into view. This addresses the
    // following scenario:
    // (1) Select a node in the tree
    // (2) Scroll the selected node out of the viewport
    // (3) Press the up or down arrow key to change the selected node
    // (4) The new node should scroll into view
    if (!prevState || this.state.selectedKeys !== prevState.selectedKeys) {
      const firstSelectedDescendant = this.refs[FIRST_SELECTED_DESCENDANT_REF];
      if (firstSelectedDescendant !== undefined) {
        ReactDOM.findDOMNode(firstSelectedDescendant).scrollIntoViewIfNeeded(false);
      }
    }

    if (this._emitter) {
      this._emitter.emit('did-update');
    }
  },

  _deselectDescendants(root: LazyTreeNode): void {
    const selectedKeys = this.state.selectedKeys;

    forEachCachedNode(root, node => {
      // `forEachCachedNode` iterates over the root, but it should remain
      // selected. Skip it.
      if (node === root) {
        return;
      }

      selectedKeys.delete(node.getKey());
    });

    this.setState({selectedKeys});
  },

  _isNodeExpanded(node: LazyTreeNode): boolean {
    return this.state.expandedKeys.has(node.getKey());
  },

  _isNodeSelected(node: LazyTreeNode): boolean {
    return this.state.selectedKeys.has(node.getKey());
  },

  _toggleNodeExpanded(node: LazyTreeNode, forceExpanded?: ?boolean): void {
    const expandedKeys = this.state.expandedKeys;
    const keyAdded = toggleSetHas(expandedKeys, node.getKey(), forceExpanded);

    // If the node was collapsed, deselect its descendants so only nodes visible
    // in the tree remain selected.
    if (!keyAdded) {
      this._deselectDescendants(node);
    }

    this.setState({expandedKeys});
  },

  _toggleNodeSelected(node: LazyTreeNode, forceSelected?: ?boolean): void {
    const selectedKeys = this.state.selectedKeys;
    toggleSetHas(selectedKeys, node.getKey(), forceSelected);
    this.setState({selectedKeys});
  },

  _onClickNode(event: SyntheticMouseEvent, node: LazyTreeNode): void {
    if (event.metaKey) {
      this._toggleNodeSelected(node);
      return;
    }

    this.setState({
      selectedKeys: new Set([node.getKey()]),
    });

    if (!this._isNodeSelected(node) &&
        (node.isContainer() || !atom.config.get('tabs.usePreviewTabs'))) {
      // User clicked on a new directory or the user isn't using the "Preview Tabs" feature of the
      // `tabs` package, so don't toggle the node's state any further yet.
      return;
    }

    this._confirmNode(node);
  },

  _onClickNodeArrow(event: SyntheticEvent, node: LazyTreeNode): void {
    this._toggleNodeExpanded(node);
  },

  _onDoubleClickNode(event: SyntheticMouseEvent, node: LazyTreeNode): void {
    // Double clicking a non-directory will keep the created tab open.
    if (!node.isContainer()) {
      this.props.onKeepSelection();
    }
  },

  _onMouseDown(event: SyntheticMouseEvent, node: LazyTreeNode): void {
    // Select the node on right-click.
    if (event.button === 2 || (event.button === 0 && event.ctrlKey === true)) {
      if (!this._isNodeSelected(node)) {
        this.setState({selectedKeys: new Set([node.getKey()])});
      }
    }
  },

  addContextMenuItemGroup(menuItemDefinitions: Array<TreeMenuItemDefinition>): void {
    let items = menuItemDefinitions.slice();
    items = items.map(definition => {
      definition.shouldDisplay = () => {
        if (this.state.roots.length === 0 && !definition.shouldDisplayIfTreeIsEmpty) {
          return false;
        }
        const shouldDisplayForSelectedNodes = definition.shouldDisplayForSelectedNodes;
        if (shouldDisplayForSelectedNodes) {
          return shouldDisplayForSelectedNodes.call(definition, this.getSelectedNodes());
        }
        return true;
      };
      return definition;
    });

    // Atom is smart about only displaying a separator when there are items to
    // separate, so there will never be a dangling separator at the end.
    items.push({type: 'separator'});

    // TODO: Use a computed property when supported by Flow.
    const contextMenuObj = {};
    contextMenuObj[this.props.eventHandlerSelector] = items;
    atom.contextMenu.add(contextMenuObj);
  },

  render(): ?ReactElement {
    if (this.state.roots.length === 0) {
      return this.props.elementToRenderWhenEmpty;
    }

    const children = [];
    const expandedKeys = this.state.expandedKeys;
    let foundFirstSelectedDescendant: boolean = false;

    const promises: Array<Promise> = [];
    const allKeys: Array<string> = [];
    const keyToNode: { [key:string]: LazyTreeNode} = {};

    this.state.roots.forEach(root => {
      const stack = [{node: root, depth: 0}];

      while (stack.length !== 0) {
        // Pop off the top of the stack and add it to the list of nodes to display.
        const item = stack.pop();
        const node = item.node;

        // Keep a reference the first selected descendant with
        // `this.refs[FIRST_SELECTED_DESCENDANT_REF]`.
        const isNodeSelected: boolean = this._isNodeSelected(node);
        let ref: ?string = null;
        if (!foundFirstSelectedDescendant && isNodeSelected) {
          foundFirstSelectedDescendant = true;
          ref = FIRST_SELECTED_DESCENDANT_REF;
        }

        const child = (
          <TreeNodeComponent {...item}
            isContainer={node.isContainer()}
            isExpanded={this._isNodeExpanded(node)}
            isLoading={!node.isCacheValid()}
            isSelected={isNodeSelected}
            label={node.getLabel()}
            labelClassName={this.props.labelClassNameForNode(node)}
            rowClassName={this.props.rowClassNameForNode(node)}
            onClickArrow={this._onClickNodeArrow}
            onClick={this._onClickNode}
            onDoubleClick={this._onDoubleClickNode}
            onMouseDown={this._onMouseDown}
            path={node.getKey()}
            key={node.getKey()}
            ref={ref}
          />
        );
        children.push(child);
        allKeys.push(node.getKey());
        keyToNode[node.getKey()] = node;

        // Check whether the node has any children that should be displayed.
        if (!node.isContainer() || !expandedKeys.has(node.getKey())) {
          continue;
        }

        const cachedChildren = node.getCachedChildren();
        if (!cachedChildren || !node.isCacheValid()) {
          promises.push(node.fetchChildren());
        }

        // Prevent flickering by always rendering cached children -- if they're invalid,
        // then the fetch will happen soon.
        if (cachedChildren) {
          const depth = item.depth + 1;
          // Push the node's children on the stack in reverse order so that when
          // they are popped off the stack, they are iterated in the original
          // order.
          cachedChildren.reverse().forEach(childNode => {
            stack.push({node: childNode, depth});
          });
        }
      }
    });

    if (promises.length) {
      Promise.all(promises).then(() => {
        // The component could have been unmounted by the time the promises are resolved.
        if (this.isMounted()) {
          this.forceUpdate();
        }
      });
    }

    this._allKeys = allKeys;
    this._keyToNode = keyToNode;
    return (
      <div className="nuclide-tree-root">
        {children}
      </div>
    );
  },

  componentWillMount(): void {
    const allKeys = [];
    const keyToNode = {};

    this.state.roots.forEach(root => {
      const rootKey = root.getKey();
      allKeys.push(rootKey);
      keyToNode[rootKey] = root;
    });

    const subscriptions = new CompositeDisposable();
    subscriptions.add(atom.commands.add(
      this.props.eventHandlerSelector,
      {
        // Expand and collapse.
        'core:move-right': () => this._expandSelection(),
        'core:move-left': () => this._collapseSelection(),

        // Move selection up and down.
        'core:move-up': () => this._moveSelectionUp(),
        'core:move-down': () => this._moveSelectionDown(),

        'core:confirm': () => this._confirmSelection(),
      })
    );

    this._allKeys = allKeys;
    this._emitter = new EventEmitter();
    this._keyToNode = keyToNode;
    this._subscriptions = subscriptions;
  },

  componentWillUnmount(): void {
    if (this._subscriptions) {
      this._subscriptions.dispose();
    }
    if (this._emitter) {
      this._emitter.removeAllListeners();
    }
  },

  serialize(): TreeComponentState {
    return {
      expandedNodeKeys: Array.from(this.state.expandedKeys),
      selectedNodeKeys: Array.from(this.state.selectedKeys),
    };
  },

  invalidateCachedNodes(): void {
    this.state.roots.forEach(root => {
      forEachCachedNode(root, node => {
        node.invalidateCache();
      });
    });
  },

  /**
   * Returns a Promise that's resolved when the roots are rendered.
   */
  setRoots(roots: Array<LazyTreeNode>): Promise<void> {
    this.state.roots.forEach(root => {
      this.removeStateForSubtree(root);
    });

    const expandedKeys = this.state.expandedKeys;
    roots.forEach(root => expandedKeys.add(root.getKey()));

    // We have to create the listener before setting the state so it can pick
    // up the changes from `setState`.
    const promise = this._createDidUpdateListener(/* shouldResolve */ () => {
      const rootsReady = (this.state.roots === roots);
      const childrenReady = this.state.roots.every(root => root.isCacheValid());
      return rootsReady && childrenReady;
    });

    this.setState({
      roots,
      expandedKeys,
    });

    return promise;
  },

  _createDidUpdateListener(shouldResolve: () => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const listener = () => {
        if (shouldResolve()) {
          resolve(undefined);

          // Set this to null so this promise can't be rejected anymore.
          this._rejectDidUpdateListenerPromise = null;
          if (this._emitter) {
            this._emitter.removeListener('did-update', listener);
          }
        }
      };

      if (this._emitter) {
        this._emitter.addListener('did-update', listener);
      }

      // We need to reject the previous promise, so it doesn't get leaked.
      if (this._rejectDidUpdateListenerPromise) {
        this._rejectDidUpdateListenerPromise();
        this._rejectDidUpdateListenerPromise = null;
      }
      this._rejectDidUpdateListenerPromise = () => {
        reject(undefined);
        if (this._emitter) {
          this._emitter.removeListener('did-update', listener);
        }
      };
    });
  },

  removeStateForSubtree(root: LazyTreeNode): void {
    const expandedKeys = this.state.expandedKeys;
    const selectedKeys = this.state.selectedKeys;

    forEachCachedNode(root, node => {
      const cachedKey = node.getKey();
      expandedKeys.delete(cachedKey);
      selectedKeys.delete(cachedKey);
    });

    this.setState({
      expandedKeys,
      selectedKeys,
    });
  },

  getRootNodes(): Array<LazyTreeNode> {
    return this.state.roots;
  },

  getExpandedNodes(): Array<LazyTreeNode> {
    const expandedNodes = [];
    this.state.expandedKeys.forEach(key => {
      const node = this.getNodeForKey(key);
      if (node != null) {
        expandedNodes.push(node);
      }
    });
    return expandedNodes;
  },

  getSelectedNodes(): Array<LazyTreeNode> {
    const selectedNodes = [];
    this.state.selectedKeys.forEach(key => {
      const node = this.getNodeForKey(key);
      if (node != null) {
        selectedNodes.push(node);
      }
    });
    return selectedNodes;
  },

  // Return the key for the first node that is selected, or null if there are none.
  _getFirstSelectedKey(): ?string {
    if (this.state.selectedKeys.size === 0) {
      return null;
    }

    let selectedKey;
    if (this._allKeys != null) {
      this._allKeys.every(key => {
        if (this.state.selectedKeys.has(key)) {
          selectedKey = key;
          return false;
        }
        return true;
      });
    }

    return selectedKey;
  },

  _expandSelection(): void {
    const key = this._getFirstSelectedKey();
    if (key) {
      this.expandNodeKey(key);
    }
  },

  /**
   * Selects a node by key if it's in the file tree; otherwise, do nothing.
   */
  selectNodeKey(nodeKey: string): Promise<void> {
    if (!this.getNodeForKey(nodeKey)) {
      return Promise.reject();
    }

    // We have to create the listener before setting the state so it can pick
    // up the changes from `setState`.
    const promise =
      this._createDidUpdateListener(/* shouldResolve */ () => this.state.selectedKeys.has(nodeKey));
    this.setState({selectedKeys: new Set([nodeKey])});
    return promise;
  },

  getNodeForKey(nodeKey: string): ?LazyTreeNode {
    if (this._keyToNode != null) {
      return this._keyToNode[nodeKey];
    }
  },

  /**
   * If this function is called multiple times in parallel, the later calls will
   * cause the previous promises to reject even if they end up expanding the
   * node key successfully.
   *
   * If we don't reject, then we might leak promises if a node key is expanded
   * and collapsed in succession (the collapse could succeed first, causing
   * the expand to never resolve).
   */
  expandNodeKey(nodeKey: string): Promise<void> {
    const node = this.getNodeForKey(nodeKey);

    if (node && node.isContainer()) {
      const promise = this._createDidUpdateListener(/* shouldResolve */ () => {
        const isExpanded = this.state.expandedKeys.has(nodeKey);
        const nodeNow = this.getNodeForKey(nodeKey);
        const isDoneFetching = (nodeNow && nodeNow.isContainer() && nodeNow.isCacheValid());
        return isExpanded && isDoneFetching;
      });
      this._toggleNodeExpanded(node, true /* forceExpanded */);
      return promise;
    }

    return Promise.resolve();
  },

  collapseNodeKey(nodeKey: string): Promise<void> {
    const node = this.getNodeForKey(nodeKey);

    if (node && node.isContainer()) {
      const promise = this._createDidUpdateListener(
        /* shouldResolve */ () => !this.state.expandedKeys.has(nodeKey)
      );
      this._toggleNodeExpanded(node, false /* forceExpanded */);
      return promise;
    }

    return Promise.resolve();
  },

  isNodeKeyExpanded(nodeKey: string): boolean {
    return this.state.expandedKeys.has(nodeKey);
  },

  _collapseSelection(): void {
    const key = this._getFirstSelectedKey();
    if (!key) {
      return;
    }

    const expandedKeys = this.state.expandedKeys;
    const node = this.getNodeForKey(key);
    if ((node != null) && (!expandedKeys.has(key) || !node.isContainer())) {
      // If the selection is already collapsed or it's not a container, select its parent.
      const parent = node.getParent();
      if (parent) {
        this.selectNodeKey(parent.getKey());
      }
    }

    this.collapseNodeKey(key);
  },

  _moveSelectionUp(): void {
    const allKeys = this._allKeys;
    if (!allKeys) {
      return;
    }

    let keyIndexToSelect = allKeys.length - 1;
    const key = this._getFirstSelectedKey();
    if (key) {
      keyIndexToSelect = allKeys.indexOf(key);
      if (keyIndexToSelect > 0) {
        --keyIndexToSelect;
      }
    }

    this.setState({selectedKeys: new Set([allKeys[keyIndexToSelect]])});
  },

  _moveSelectionDown(): void {
    const allKeys = this._allKeys;
    if (!allKeys) {
      return;
    }

    let keyIndexToSelect = 0;
    const key = this._getFirstSelectedKey();
    if (key) {
      keyIndexToSelect = allKeys.indexOf(key);
      if (keyIndexToSelect !== -1 && keyIndexToSelect < allKeys.length - 1) {
        ++keyIndexToSelect;
      }
    }

    this.setState({selectedKeys: new Set([allKeys[keyIndexToSelect]])});
  },

  _confirmSelection(): void {
    const key = this._getFirstSelectedKey();
    if (key) {
      const node = this.getNodeForKey(key);
      if (node) {
        this._confirmNode(node);
      }
    }
  },

  _confirmNode(node: LazyTreeNode): void {
    if (node.isContainer()) {
      this._toggleNodeExpanded(node);
    } else {
      this.props.onConfirmSelection(node);
    }
  },
});
