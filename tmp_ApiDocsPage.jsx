import React from 'react'

export const ApiDocsPage = () => {
  const mqttEndpoints = [
    // 諛쒗뻾 硫붿떆吏 (Publish)
    {
      type: 'Publish',
      topic: 'bmtl/request/settings/all',
      description:
        '?꾩껜 ?ㅼ젙 遺덈윭?ㅺ린 ?붿껌 (媛?紐⑤뱢??bmtl/status/health/{device_id}濡?媛쒕퀎 ?묐떟)',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/settings/01',
      description: '媛쒕퀎 紐⑤뱢 ?꾩옱?ㅼ젙 遺덈윭?ㅺ린 ?붿껌',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/set/settings/01',
      description: '媛쒕퀎 紐⑤뱢 ?ㅼ젙 蹂寃?,
      qos: '2',
      payload: {
        start_time: '08:00',
        end_time: '18:00',
        capture_interval: 10,
        image_size: '1920x1080',
        quality: '?믪쓬',
        iso: '400',
        format: 'JPG',
        aperture: 'f/2.8',
      },
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/reboot/all',
      description: '?꾩껜 ?щ???紐낅졊',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/reboot/01',
      description: '媛쒕퀎 紐⑤뱢 ?щ???(01踰?紐⑤뱢 ?덉떆)',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/options/01',
      description: '媛쒕퀎 紐⑤뱢 options ?붿껌',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/options/all',
      description: '?꾩껜 紐⑤뱢 options ?붿껌',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/wiper/01',
      description: '媛쒕퀎 紐⑤뱢 ??댄띁 30珥??숈옉 (01踰?紐⑤뱢 ?덉떆)',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/camera-on-off/01',
      description: '媛쒕퀎 紐⑤뱢 移대찓???꾩썝 On/Off (01踰?紐⑤뱢 ?덉떆)',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/set/sitename/01',
      description: '媛쒕퀎 紐⑤뱢 ?ъ씠???대쫫 蹂寃?(01踰?紐⑤뱢 ?덉떆)',
      qos: '2',
      payload: {
        sitename: '?덈줈???ъ씠?몃챸',
      },
    },
    {
      type: 'Publish',
      topic: 'bmtl/sw-update/01',
      description: '媛쒕퀎 紐⑤뱢 ?뚰봽?몄썾???낅뜲?댄듃 (01踰?紐⑤뱢 ?덉떆)',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/sw-rollback/01',
      description: '媛쒕퀎 紐⑤뱢 ?뚰봽?몄썾??濡ㅻ갚 (01踰?紐⑤뱢 ?덉떆)',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/status/01',
      description: '媛쒕퀎 紐⑤뱢 ?곹깭 ?붿껌 (01踰?紐⑤뱢 ?덉떆)',
      qos: '2',
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/status/all',
      description:
        '?꾩껜 紐⑤뱢 ?곹깭 ?붿껌 (媛?紐⑤뱢??bmtl/status/health/{device_id}濡??묐떟)',
      qos: '2',
    },
    // 援щ룆 硫붿떆吏 (Subscribe)
    {
      type: 'Subscribe',
      topic: 'bmtl/status/health/+',
      description: '?붾컮?댁뒪 ?ъ뒪 ?곹깭 ?섏떊',
      qos: '0-1',
      payload: {
        module_id: 'bmotion01',
        storage_used: 45.2,
        temperature: 42.3,
        last_capture_time: '2024-01-01T12:30:00Z',
        last_boot_time: '2024-01-01T08:15:00Z',
        site_name: '?꾩옣紐?,
        today_total_captures: 100,
        today_captured_count: 85,
        missed_captures: 3,
        sw_version: 'v1.0.0',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/settings/+',
      description: '媛쒕퀎 ?ㅼ젙 ?묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'settings',
        module_id: 'camera_01',
        settings: {
          start_time: '08:00',
          end_time: '18:00',
          capture_interval: 10,
          image_size: '1920x1080',
          quality: '?믪쓬',
          iso: '400',
          format: 'JPG',
          aperture: 'f/2.8',
        },
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/set/settings/+',
      description: '?ㅼ젙 蹂寃??묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'set_settings_result',
        module_id: 'camera_01',
        success: true,
        message: 'Settings applied successfully',
        applied_settings: {
          start_time: '08:00',
          end_time: '18:00',
          capture_interval: 10,
        },
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/reboot/01',
      description: '媛쒕퀎 紐⑤뱢 ?щ????묐떟 ?섏떊 (01踰?紐⑤뱢 ?덉떆)',
      qos: '1',
      payload: {
        response_type: 'reboot_result',
        module_id: 'camera_01',
        success: true,
        message: 'Reboot initiated successfully',
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/reboot/all',
      description: '?꾩껜 ?щ????묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'reboot_all_result',
        success: true,
        message: 'Global reboot initiated successfully',
        affected_modules: ['camera_01', 'camera_02'],
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/options/+',
      description: '媛쒕퀎 紐⑤뱢 options ?묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'options',
        module_id: 'camera_01',
        options: {
          supported_resolutions: ['1920x1080', '1280x720'],
          supported_formats: ['JPG', 'RAW'],
          iso_range: [100, 6400],
          aperture_range: ['f/1.4', 'f/16'],
        },
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/options/all',
      description: '?꾩껜 紐⑤뱢 options ?묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'all_options',
        modules: {
          camera_01: {
            supported_resolutions: ['1920x1080', '1280x720'],
            supported_formats: ['JPG', 'RAW'],
            iso_range: [100, 6400],
            aperture_range: ['f/1.4', 'f/16'],
          },
        },
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/wiper/+',
      description: '??댄띁 ?숈옉 ?묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'wiper_result',
        module_id: 'camera_01',
        success: true,
        message: 'Wiper operation completed',
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/camera-on-off/+',
      description: '移대찓???꾩썝 ?쒖뼱 ?묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'camera_power_result',
        module_id: 'camera_01',
        success: true,
        message: 'Camera power toggled successfully',
        new_state: 'on/off',
        timestamp: '2024-01-01T00:00:00Z',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/sitename/+',
      description: '?ъ씠???대쫫 蹂寃??묐떟 ?섏떊',
      qos: '1',
      payload: {
        response_type: 'sitename_result',
        module_id: 'camera_01',
        success: true,
        message: 'Sitename changed successfully',
        sitename: '?덈줈???ъ씠?몃챸',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/sw-update/+',
      description: '?뚰봽?몄썾???낅뜲?댄듃 ?묐떟 ?섏떊',
      qos: '1',
      payload: {
        success: true,
        message: 'Software update completed successfully',
        version: 'v1.2.3',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/sw-version/+',
      description: '?뚰봽?몄썾??踰꾩쟾 ?뺣낫 ?섏떊',
      qos: '1',
      payload: {
        version: 'a1b2c3d4',
      },
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/sw-rollback/+',
      description: '?뚰봽?몄썾??濡ㅻ갚 ?묐떟 ?섏떊',
      qos: '1',
      payload: {
        success: true,
        message: 'Rollback completed successfully',
      },
    },
  ]



  return (
    <div className='api-docs-page'>
      <div className='docs-header'>
        <h1>?뱴 MQTT API 紐낆꽭??/h1>
        <p>BMTL Control System??MQTT ?듭떊 ?꾨줈?좎퐳 臾몄꽌</p>
      </div>

      {/* Endpoints */}
      <section className='endpoints-section'>
        <h2>?뱻 MQTT ?좏뵿 & 硫붿떆吏</h2>
        <div className='endpoints-tiles'>
          {mqttEndpoints.map((endpoint, index) => (
            <div key={index} className='endpoint-card'>
              <div className='endpoint-header'>
                <span className={`method ${endpoint.type.toLowerCase()}`}>
                  {endpoint.type.toUpperCase()}
                </span>
                <code className='topic'>{endpoint.topic}</code>
                <span className='qos-badge'>QoS {endpoint.qos}</span>
              </div>

              <div className='endpoint-details'>
                <div className='description'>
                  <strong>?ㅻ챸:</strong> {endpoint.description}
                </div>

                {endpoint.payload &&
                  Object.keys(endpoint.payload).length > 0 && (
                    <div className='payload-section'>
                      <strong>?섏씠濡쒕뱶 ?덉떆:</strong>
                      <pre className='payload-code'>
                        {JSON.stringify(endpoint.payload, null, 2)}
                      </pre>
                    </div>
                  )}
              </div>
            </div>
          ))}
          <div className='pattern-item'>
            <code>bmtl/response/camera-power-status/+</code>
            <span>移대찓???꾩썝 ?곹깭 ?묐떟 (紐⑤뱢踰덊샇)</span>
          </div>
        </div>
      </section>

      {/* Topic Patterns */}
      <section className='patterns-section'>
        <h2>?렞 ?좏뵿 ?⑦꽩</h2>
        <div className='pattern-list'>
          <div className='pattern-item'>
            <code>bmtl/status/health/+</code>
            <span>紐⑤뱺 移대찓??紐⑤뱢???ъ뒪 ?곹깭</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/request/settings/+</code>
            <span>?ㅼ젙 ?붿껌 (all? ?ъ뒪泥댄겕濡??묐떟, 紐⑤뱢踰덊샇??媛쒕퀎 ?묐떟)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/settings/+</code>
            <span>媛쒕퀎 ?ㅼ젙 ?묐떟 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/set/settings/+</code>
            <span>?ㅼ젙 蹂寃??붿껌</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/set/settings/+</code>
            <span>?ㅼ젙 蹂寃??묐떟</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/request/options/+</code>
            <span>媛쒕퀎 紐⑤뱢 options ?붿껌 (紐⑤뱢踰덊샇 ?먮뒗 all)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/options/+</code>
            <span>媛쒕퀎 紐⑤뱢 options ?묐떟 (紐⑤뱢踰덊샇 ?먮뒗 all)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/request/reboot/+</code>
            <span>?щ????붿껌 (紐⑤뱢踰덊샇 ?먮뒗 all)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/reboot/+</code>
            <span>?щ????묐떟 (紐⑤뱢踰덊샇 ?먮뒗 all)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/request/wiper/+</code>
            <span>??댄띁 ?숈옉 ?붿껌 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/wiper/+</code>
            <span>??댄띁 ?숈옉 ?묐떟 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/request/camera-on-off/+</code>
            <span>移대찓???꾩썝 ?쒖뼱 ?붿껌 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/camera-on-off/+</code>
            <span>移대찓???꾩썝 ?쒖뼱 ?묐떟 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/set/sitename/+</code>
            <span>?ъ씠???대쫫 蹂寃??붿껌 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/set/sitename/+</code>
            <span>?ъ씠???대쫫 蹂寃??묐떟 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/sw-update/+</code>
            <span>?뚰봽?몄썾???낅뜲?댄듃 ?붿껌 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/sw-update/+</code>
            <span>?뚰봽?몄썾???낅뜲?댄듃 ?묐떟 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/sw-version/+</code>
            <span>?뚰봽?몄썾??踰꾩쟾 ?뺣낫 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/sw-rollback/+</code>
            <span>?뚰봽?몄썾??濡ㅻ갚 ?붿껌 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/response/sw-rollback/+</code>
            <span>?뚰봽?몄썾??濡ㅻ갚 ?묐떟 (紐⑤뱢踰덊샇)</span>
          </div>
          <div className='pattern-item'>
            <code>bmtl/request/status/+</code>
            <span>?곹깭 ?붿껌 (all ?먮뒗 紐⑤뱢踰덊샇, ?ъ뒪泥댄겕濡??묐떟)</span>
          </div>
        </div>
      </section>

      {/* Error Codes */}
      <section className='errors-section'>
        <h2>?좑툘 ?먮윭 肄붾뱶</h2>
        <div className='error-table'>
          <div className='error-row header'>
            <div>肄붾뱶</div>
            <div>?ㅻ챸</div>
            <div>?닿껐諛⑸쾿</div>
          </div>
          <div className='error-row'>
            <div>
              <code>CONN_ERR</code>
            </div>
            <div>釉뚮줈而??곌껐 ?ㅽ뙣</div>
            <div>釉뚮줈而?二쇱냼? ?ы듃 ?뺤씤</div>
          </div>
          <div className='error-row'>
            <div>
              <code>AUTH_ERR</code>
            </div>
            <div>?몄쬆 ?ㅽ뙣</div>
            <div>?ъ슜?먮챸/鍮꾨?踰덊샇 ?뺤씤</div>
          </div>
          <div className='error-row'>
            <div>
              <code>SUB_ERR</code>
            </div>
            <div>援щ룆 ?ㅽ뙣</div>
            <div>?좏뵿 沅뚰븳 ?뺤씤</div>
          </div>
          <div className='error-row'>
            <div>
              <code>PUB_ERR</code>
            </div>
            <div>諛쒗뻾 ?ㅽ뙣</div>
            <div>?섏씠濡쒕뱶 ?ш린 諛??뺤떇 ?뺤씤</div>
          </div>
        </div>
      </section>
    </div>
  )
}


