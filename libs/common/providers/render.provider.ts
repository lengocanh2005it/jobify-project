import { Injectable } from '@nestjs/common';
import { SocialLogin } from 'libs/common/utils';
import { Google } from 'libs/common/views';
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';

@Injectable()
export class RenderProvider {
  renderReactComponent(platform: 'google' | 'facebook', userInfo: SocialLogin) {
    let element: React.ReactElement | null = null;

    if (platform === 'google') {
      element = React.createElement(Google, {
        title: 'Google Authentication',
        email: userInfo?.email ? userInfo.email : '',
        googleId: userInfo.provider_id,
      });
    }

    if (element) {
      const html = ReactDOMServer.renderToString(element);
      return html;
    }
  }
}
