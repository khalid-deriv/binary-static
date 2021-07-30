/* eslint-disable no-console */
const Client         = require('../base/client');
const CookieStorage  = require('../../_common/storage').CookieStorage;
const LocalStore     = require('../../_common/storage').LocalStore;
const Url            = require('../../_common/url');

/*
 * Handles utm parameters/referrer to use on signup
 *
 * Priorities:
 * 1. Cookie having utm data (utm_source, utm_medium, utm_campaign) [Expires in 3 months]
 * 2. Query string utm parameters
 * 3. document.referrer
 *
 */

const TrafficSource = (() => {
    let cookie;
    const utm_fields = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'utm_ad_id',
        'utm_adgroup_id',
        'utm_campaign_id',
    ];

    const initCookie = () => {
        if (!cookie) {
            cookie = new CookieStorage('utm_data');
            cookie.read();
            // expiration date is used when writing cookie
            const now      = new Date();
            cookie.expires = now.setMonth(now.getMonth() + 3);
        }
    };

    const getData = () => {
        initCookie();
        const data = cookie.value;
        Object.keys(data).map((key) => {
            data[key] = (data[key] || '').replace(/[^a-zA-Z0-9\s-._]/gi, '').substring(0, 100);
        });
        return data;
    };

    const shouldOverwrite = (new_utm_data, current_utm_data) => {
        if (!current_utm_data) {
            return true;
        } else if (!new_utm_data) {
            return false;
        }
        
        // Check if both new and old utm_data has all required filds
        const required_fields = ['utm_source', 'utm_medium', 'utm_campaign'];
        const has_all_params = required_fields.every((field) => new_utm_data[field] && current_utm_data[field]);
        
        // Overwrite based on the order of priority
        if (has_all_params) {
            if (new_utm_data.utm_medium.includes('aff')) return true; // 1. Affiliate tags
            else if (new_utm_data.utm_medium.includes('ppc') && !current_utm_data.utm_medium.includes('aff')) return true; // 2. PPC tags
            else if (!current_utm_data.utm_medium.includes('ppc') && !current_utm_data.utm_medium.includes('aff')) return true; // 3. Complete set of required tags
        } else if (Object.values(new_utm_data).length > Object.values(current_utm_data).length) return true; // 4. Everything else
        return false;
    };

    // get source in order of precedence
    const getSource = (utm_data = getData()) => utm_data.utm_source || utm_data.referrer || null;

    const setData = () => {
        if (Client.isLoggedIn()) {
            clearData();
            return;
        }

        const new_values     = { utm_source: getSource() };
        const current_values = getData();
        const params         = Url.paramsHash();

        // If the user has any new UTM params, store them
        utm_fields.forEach((field) => {
            if (params[field]) {
                new_values[field] = params[field].replace(/[^a-zA-Z0-9\s\-\.\_]/gi, '').substring(0, 100); // Limit to 100 supported characters
            }
        });

        // Check if params has utm data
        if (shouldOverwrite(new_values, current_values)) {
            clearData();
            Object.keys(new_values).forEach((key) => {
                if (new_values[key]) {
                    cookie.set(key, new_values[key], { sameSite: 'none', secure: true });
                }
            });
        }

        // Store gclid
        if (params.gclid && !Client.isLoggedIn()) {
            LocalStore.set('gclid', params.gclid);
        }
    };

    const clearData = () => {
        initCookie();
        cookie.remove();
    };

    return {
        getData,
        setData,
        clearData,
        getSource,
    };
})();

module.exports = TrafficSource;
