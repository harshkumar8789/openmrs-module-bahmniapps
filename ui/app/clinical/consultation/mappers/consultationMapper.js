Bahmni.ConsultationMapper = function (dosageFrequencies, dosageInstructions, consultationNoteConcept, labOrderNoteConcept) {

    var filterPreviousOrderOfRevisedOrders = function (orders) {
        return _.filter(orders, function (drugOrder) {
            return !_.some(orders, function (otherDrugOrder) {
                return otherDrugOrder.action === Bahmni.Clinical.Constants.orderActions.revise && otherDrugOrder.encounterUuid === drugOrder.encounterUuid && otherDrugOrder.previousOrderUuid === drugOrder.uuid
            });
        });
    };

    this.map = function (encounterTransaction) {
        var encounterUuid = encounterTransaction.encounterUuid;
        var specialObservationConceptUuids = [consultationNoteConcept.uuid, labOrderNoteConcept.uuid];
        var investigations = encounterTransaction.orders.filter(function (order) {
            return !order.voided
        });
        var labResults = new Bahmni.LabResultsMapper().map(encounterTransaction);
        var nonVoidedDrugOrders = encounterTransaction.drugOrders.filter(function (order) {
            return !order.voided && order.action != Bahmni.Clinical.Constants.orderActions.discontinue;
        });
        nonVoidedDrugOrders = filterPreviousOrderOfRevisedOrders(nonVoidedDrugOrders);

        var treatmentDrugs = nonVoidedDrugOrders.map(function (drugOrder) {
            return Bahmni.Clinical.DrugOrderViewModel.createFromContract(drugOrder);
        });
        var consultationNote = mapSpecialObservation(encounterTransaction.observations, consultationNoteConcept);

        var labOrderNote = mapSpecialObservation(encounterTransaction.observations, labOrderNoteConcept);

        var observations = encounterTransaction.observations.filter(function (observation) {
            return !observation.voided && specialObservationConceptUuids.indexOf(observation.concept.uuid) === -1;
        });

        var orders = encounterTransaction.orders.filter(function (order) {
            return order.action != Bahmni.Clinical.Constants.orderActions.discontinue && !order.dateStopped;
        });

        return {
            visitUuid: encounterTransaction.visitUuid,
            visitTypeUuid: encounterTransaction.visitTypeUuid,
            encounterUuid: encounterUuid,
            investigations: investigations,
            treatmentDrugs: treatmentDrugs,
            newlyAddedDiagnoses: [],
            labResults: labResults,
            consultationNote: consultationNote || emptyObservation(consultationNoteConcept),
            labOrderNote: labOrderNote || emptyObservation(labOrderNoteConcept),
            observations: observations,
            disposition: encounterTransaction.disposition,
            encounterDateTime: encounterTransaction.encounterDateTime,
            orders: orders,
            providers: encounterTransaction.providers,
            locationUuid: encounterTransaction.locationUuid
        };
    };

    var emptyObservation = function (concept) {
        return {concept: {uuid: concept.uuid}};
    };

    var mapSpecialObservation = function (encounterObservations, specialConcept) {
        var observation = emptyObservation(specialConcept);
        var obsFromEncounter = encounterObservations.filter(function (obs) {
            return (obs.concept && obs.concept.uuid === specialConcept.uuid) && !obs.voided;
        })[0];
        if (obsFromEncounter) {
            observation.value = obsFromEncounter.value;
            observation.uuid = obsFromEncounter.uuid;
            observation.observationDateTime = obsFromEncounter.observationDateTime;
        }
        return observation;
    };


};
