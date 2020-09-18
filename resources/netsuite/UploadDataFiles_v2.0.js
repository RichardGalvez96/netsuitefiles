/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


define(['N/search', 'N/file', 'N/log', 'N/config', 'N/xml', 'N/runtime', 'N/https'],

  function(search, file, log, config, xml, runtime, https) {

    var xmlContent = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"\n' +
      'xmlns:urn="urn:messages_2020_1.platform.webservices.netsuite.com"\n' +
      'xmlns:urn1="urn:core_2020_1.platform.webservices.netsuite.com"\n' +
      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n' +
      '<soapenv:Header>\n' +
      '<urn:applicationInfo>\n' +
      '<urn:applicationId>[aplication]</urn:applicationId>\n' +
      '</urn:applicationInfo>\n' +
      '<urn:passport>\n' +
      '<urn1:email>[email]</urn1:email>\n' +
      '<urn1:password>[password]</urn1:password>\n' +
      '<urn1:account>[account]</urn1:account>\n' +
      '</urn:passport>\n' +
      '</soapenv:Header>\n' +
      '<soapenv:Body>\n' +
      '<urn:update xmlns:ns6="urn:filecabinet_2020_1.documents.webservices.netsuite.com">\n' +
      '<urn:record internalId="[file]" xsi:type="ns6:File">\n' +
      '<ns6:content xsi:type="xsd:string">[content]</ns6:content>\n' +
      '</urn:record>\n' +
      '</urn:update>\n' +
      '</soapenv:Body>\n' +
      '</soapenv:Envelope>';

    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {

      if (context.request.method == 'POST') {

        context.response.setHeader({
          name: 'Content-Type',
          value: 'application/json',
        });

        var result = {
          status: false,
          details: 'none',
        }

        var folderFilter = '';
        var fileName = '';
        var fileContent = '';
        var password = '';
        var email = '';
        var applicationId = '';

        try {

          var contextbody = JSON.parse(context.request.body);

          folderFilter = contextbody.folder;
          fileName = contextbody.file;
          fileContent = contextbody.content;
          password = contextbody.password;
          email = contextbody.email;
          applicationId = contextbody.aplication;

        } catch (err) {
          log.error('err', err);
        }

        if (fileName && fileContent && password && email && applicationId) {

          var fileObject = null;

          var filters = [
            ["filetype", "anyof", "JAVASCRIPT"],
            "AND",
            ["name", "contains", fileName],
          ];

          if (folderFilter) {

            filters.push('AND');
            filters.push(['folder', 'anyof', folderFilter]);

          }

          search.create({
            type: 'file',
            filters: filters,
            columns: ['internalid']
          }).run().each(function(line) {
            fileObject = line.id;
          });

          if (fileObject) {

            var nsConfig = config.load({
              type: config.Type.COMPANY_INFORMATION
            });

            var url = nsConfig.getValue('suitetalkurl');

            url += '/services/NetSuitePort_2020_1';

            xmlContent = xmlContent.replace('[file]', fileObject);

            xmlContent = xmlContent.replace('[aplication]', applicationId);

            xmlContent = xmlContent.replace('[email]', email);

            xmlContent = xmlContent.replace('[password]', password);

            xmlContent = xmlContent.replace('[account]', runtime.accountId);

            xmlContent = xmlContent.replace('[content]', fileContent);

            log.error('context send', xmlContent);

            var httpContext = '';

            try {

              httpContext = https.post({
                headers: {
                  'Accept-Encoding': 'gzip,deflate',
                  'Content-Type': 'text/xml;charset=UTF-8',
                  'SOAPaction': 'update'
                },
                url: url,
                body: xmlContent
              });

              httpContext = httpContext.body;
              log.error('result', httpContext);
              if (httpContext.indexOf('isSuccess="true"') > -1) {
                result.status = true;
                result.details = 'The file was updated successfuly.'
              }

            } catch (err) {

              result.details = "Undefined error. Try Again.";

            }

          } else {
            result.details = "The file is not found.";
          }

        } else {
          result.details = "There is any empty field.";
        }

        context.response.write(JSON.stringify(result));

      }

    }

    return {
      onRequest: onRequest
    };

  });
