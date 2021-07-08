/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/query', 'N/search'],
    /**
     * @param{record} record
     * @param{query} query
     * @param{search} search
     */
    (record, query, search) => {
        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            let {
                DEPARTMENT: departmentType,
                ITEM: itemType,
                SUBSIDIARY: subsidiaryType,
                LOCATION: locationType
            } = search.Type;

            let {
                reasonCode,
                department: departmentName,
                subsidiary: subsidiaryName,
                trandate,
                item: itemName,
                location: locationName,
                adjustQtyBy
            } = requestBody;

            let recordId;
            let reasonCodeAcct = getReasonCodeAcct(reasonCode);
            let reasonCodeId = getReasonCodeId(reasonCode);
            let departmentId = getIdFromName(departmentName, departmentType);
            let subsidiaryId = getIdFromName(subsidiaryName, subsidiaryType);
            let locationId = getIdFromName(locationName, locationType);
            let itemId = getIdFromName(itemName, itemType);


            try {
                const objRecord = record.create({
                    type: record.Type.INVENTORY_ADJUSTMENT,
                    isDynamic: true
                });

                objRecord.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiaryId
                });

                objRecord.setValue({
                    fieldId: 'custbody_ic_adjustment_reason_code',
                    value: reasonCodeId
                });

                objRecord.setValue({
                    fieldId: 'account',
                    value: reasonCodeAcct
                });

                objRecord.setValue({
                    fieldId: 'trandate',
                    value: new Date(trandate)
                });

                objRecord.selectNewLine({
                    sublistId: 'inventory'
                });

                objRecord.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item',
                    value: itemId
                });

                objRecord.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'location',
                    value: locationId
                });

                objRecord.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'adjustqtyby',
                    value: adjustQtyBy
                });

                objRecord.setCurrentSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'department',
                    value: departmentId
                });

                objRecord.commitLine({
                    sublistId: 'inventory'
                });

                recordId = objRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

            } catch (err) {
                log.debug({title: err.title, details: err.message})
                return JSON.stringify({
                    status: 'failed',
                    message: err.message
                });
            }

            return JSON.stringify({
                status: 'successful',
                message: recordId
            });

        }

        const getReasonCodeAcct = (reasonCode) => {

            let reasonCodes = search.create({
                type: 'CUSTOMRECORD_IC_INV_ADJ_REASON_CODE',
                columns: [{
                    name: 'custrecord_ic_inv_adj_account'
                }, {
                    name: 'name'
                }]
                ,
                filters: [{
                    name: 'name',
                    operator: 'is',
                    values: [reasonCode]
                }]
            });


            let resultSet = reasonCodes.run().getRange({start: 0, end: 1});

            return resultSet[0].getValue({
                name: 'custrecord_ic_inv_adj_account'
            });
        }

        const getReasonCodeId = (reasonCode) => {

            let reasonCodes = query.create({
                type: 'CUSTOMRECORD_IC_INV_ADJ_REASON_CODE'
            });

            reasonCodes.columns = [
                reasonCodes.createColumn({
                    fieldId: 'id'
                })
            ]

            reasonCodes.condition = reasonCodes.createCondition({
                fieldId: 'name',
                operator: query.Operator.IS,
                values: reasonCode
            });

            let resultSet = reasonCodes.run();
            return resultSet.results[0].values[0];
        }

        const getIdFromName = (name, recordType) => {

            let idFromNameSearch = search.create({
                type: recordType,
                columns: [ {
                    name: 'name'
                }],
                filters: [{
                    name: 'name',
                    operator: 'is',
                    values: [name]
                }]
            });

            let resultSet = idFromNameSearch.run().getRange({start: 0, end: 1});

            return resultSet[0].id

        }

        return {post}
    });
