'use strict';

const Homey = require('homey');
const Device = require('../../lib/Device.js');
const boolean = require('boolean');

const refreshTimeout = 1000 * 10; // 10 sec

module.exports = class ztatzP1SmartMeterNoGenDevice extends Device {

	// this method is called when the Device is inited
	async _initDevice() {
		this.log('_initDevice');
		const device = this.getData();

		this.setUnavailable('Please remove this device and add the new device types.');

		// Register flowcard triggers
		//this._registerFlowCardTriggers();

		// Update server data
		//this._syncDevice();

		// Set update timer
		this.intervalId = setInterval(this._syncDevice.bind(this), refreshTimeout);
		this.setSettings({
			url: device.url,
		});

		console.log("register flow triggers");
		// register Flow triggers
		this._flowTriggerPowerUsageChanged = new Homey.FlowCardTriggerDevice('measure_power.consumed.changed_nogen').register();
		this._flowTriggerPowerMeterL1Changed = new Homey.FlowCardTriggerDevice('meter_power.consumedL1.changed_nogen').register();
		this._flowTriggerPowerMeterL2Changed = new Homey.FlowCardTriggerDevice('meter_power.consumedL2.changed_nogen').register();
		this._flowTriggerGasMeterChanged = new Homey.FlowCardTriggerDevice('meter_gas.current.changed_nogen').register();
	}

	async _deleteDevice() {
		this.log('_deleteDevice');

		clearInterval(this.intervalId);
	}

	// Update server data
	async _syncDevice() {
		try {
			let status = await this.api.getSmartmeter();

			if (status.length != 0) {
				//this.setAvailable();

				let usageLow = status[0][3]
				let usageHigh = status[0][4]
				let currentUsage = status[0][8]
				let currentGas = status[0][10]

				this.changeCapabilityValue('measure_power', Number(currentUsage),this._flowTriggerPowerUsageChanged,{"measure_power": Number(currentUsage)});
				this.changeCapabilityValue('meter_power.consumedL2', Number(usageLow),this._flowTriggerPowerMeterL2Changed,{"meter_power.consumedL2": Number(usageLow)});
				this.changeCapabilityValue('meter_power.consumedL1', Number(usageHigh),this._flowTriggerPowerMeterL1Changed,{"meter_power.consumedL1": Number(usageHigh)});
				this.changeCapabilityValue('meter_gas.current', Number(currentGas),this._flowTriggerGasMeterChanged,{"meter_gas.current": Number(currentGas)});


			} else {
				this.setUnavailable('Cannot refresh / Connect');
			}


		} catch (error) {
			this.error(error);
			this.setUnavailable(error.message);
		}
	}

	// this method is called when the Device has requested a state change (turned on or off)
	//async p1_kwh_used( value, opts ) {

	// ... set value to real device, e.g.
	// await setMyDeviceState({ on: value });

	// or, throw an error
	// throw new Error('Switching the device failed!');
	//}

}