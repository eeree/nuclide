'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import classnames from 'classnames';
import {React} from 'react-for-atom';

type Props = {
  className? : string;
  children: ReactElement;
};

/**
 * Visually groups Buttons passed in as children.
 */
export const ButtonToolbar = (props: Props) => {
  const {
    children,
    className,
  } = props;
  return (
    <div className={classnames('btn-toolbar', className)}>
      {children}
    </div>
  );
};
