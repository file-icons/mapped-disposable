"use strict";

const {expect} = require("chai");
const {MappedDisposable} = require("../index.js");
const {CompositeDisposable, Disposable} = require("event-kit");


describe("MappedDisposable", () => {
	it("can be constructed with an iterable", () => {
		const disposable1 = new Disposable();
		const disposable2 = new Disposable();
		const disposable3 = new CompositeDisposable();
		const map = new MappedDisposable([
			[{name: "foo"}, disposable1],
			[{name: "bar"}, disposable2],
			[{name: "baz"}, disposable3]
		]);
		map.dispose();
		expect(disposable1.disposed).to.be.true;
		expect(disposable2.disposed).to.be.true;
		expect(disposable3.disposed).to.be.true;
	});

	it("can be constructed without an iterable", () => {
		const map = new MappedDisposable();
		expect(map.disposed).to.be.false;
		map.dispose();
		expect(map.disposed).to.be.true;
	});

	it("embeds ordinary disposables in CompositeDisposables", () => {
		const disposable1 = new Disposable();
		const disposable2 = new CompositeDisposable();
		const map = new MappedDisposable([
			["foo", disposable1],
			["bar", disposable2]
		]);
		expect(map.get("foo")).to.be.instanceof(CompositeDisposable);
		expect(map.get("bar")).to.equal(disposable2);
	});

	it("allows disposables to be added to keys", () => {
		const key = {};
		const cd1 = new CompositeDisposable();
		const cd2 = new CompositeDisposable();
		const cd3 = new CompositeDisposable();
		const map = new MappedDisposable([ [key, cd1] ]);
		expect(map.get(key)).to.equal(cd1);
		map.add(key, cd2);
		expect(cd1.disposables.size).to.equal(1);
		map.add("foo", cd3);
		expect(map.size).to.equal(2);
		map.dispose();
		expect(map.disposed).to.be.true;
		expect(cd1.disposed).to.be.true;
		expect(cd2.disposed).to.be.true;
	});

	it("allows disposables to be used as keys", () => {
		let calledIt          = false;
		let toldYou           = false;
		const disposableKey   = new Disposable(() => calledIt = true);
		const disposableValue = new Disposable(() => toldYou  = true);
		const map = new MappedDisposable([ [disposableKey, disposableValue] ]);

		expect(map.size).to.equal(1);
		expect(calledIt).to.be.false;
		expect(toldYou).to.be.false;
		expect(disposableKey.disposed).to.be.false;
		expect(disposableValue.disposed).to.be.false;

		map.dispose();
		expect(map.size).to.equal(0);
		expect(disposableKey.disposed).to.be.true;
		expect(disposableValue.disposed).to.be.true;
		expect(calledIt).to.be.true;
		expect(toldYou).to.be.true;
	});

	it("calls a key's dispose() method when disposing it", () => {
		let foo = false;
		let bar = false;
		const fooDis = new Disposable(() => foo = true);
		const barDat = new Disposable(() => bar = true);
		const map = new MappedDisposable();
		map.set("foo", fooDis);
		map.set("bar", barDat);

		expect(map.size).to.equal(2);
		expect(foo).to.be.false;
		expect(bar).to.be.false;
		expect(fooDis.disposed).to.be.false;
		expect(barDat.disposed).to.be.false;

		map.dispose("foo");
		expect(map.size).to.equal(1);
		expect(foo).to.be.true;
		expect(bar).to.be.false;
		expect(fooDis.disposed).to.be.true;
		expect(barDat.disposed).to.be.false;
		expect(map.has("foo")).to.be.false;
	});

	it("allows disposables to be removed from keys", () => {
		const key = {};
		const cd1 = new CompositeDisposable();
		const cd2 = new CompositeDisposable();
		const cd3 = new CompositeDisposable();
		const cd4 = new CompositeDisposable();
		const cd5 = new CompositeDisposable();
		const map = new MappedDisposable([ [key, cd1] ]);
		map.add(key, cd2, cd3, cd4, cd5);
		expect(cd1.disposables.size).to.equal(4);
		map.remove(key, cd3, cd5);
		expect(cd1.disposables.size).to.equal(2);
		map.dispose();
		expect(map.disposed).to.be.true;
		expect(cd1.disposed).to.be.true;
		expect(cd2.disposed).to.be.true;
		expect(cd3.disposed).to.be.false;
		expect(cd4.disposed).to.be.true;
		expect(cd5.disposed).to.be.false;
	});

	it("allows other MappedDisposables to be added to keys", () => {
		const disposable = new Disposable();
		const map1 = new MappedDisposable([ ["foo", disposable] ]);
		const map2 = new MappedDisposable([ ["bar", map1] ]);
		expect(map1.get("foo").disposables.has(disposable)).to.be.true;
		expect(map2.get("bar").disposables.has(map1)).to.be.true;
		map2.dispose();
		expect(disposable.disposed).to.be.true;
		expect(map1.disposed).to.be.true;
		expect(map2.disposed).to.be.true;
	});

	it("reports accurate entry count", () => {
		const map = new MappedDisposable();
		expect(map.size).to.equal(0);
		map.add("foo", new Disposable());
		expect(map.size).to.equal(1);
		map.add("foo", new Disposable());
		map.add("bar", new Disposable());
		expect(map.size).to.equal(2);
		map.delete("foo");
		expect(map.size).to.equal(1);
		map.dispose();
		expect(map.size).to.equal(0);
	});

	it("deletes keys when disposing them", () => {
		const key = {};
		const cd1 = new CompositeDisposable();
		const map = new MappedDisposable([ [key, cd1] ]);
		map.delete(key);
		expect(map.has(key)).to.be.false;
		expect(map.get(key)).to.be.undefined;
		map.dispose();
		expect(cd1.disposed).to.be.false;
	});

	it("deletes all keys when disposed", () => {
		const map = new MappedDisposable([
			["foo", new Disposable()],
			["bar", new Disposable()]
		]);
		expect(map.has("foo")).to.be.true;
		expect(map.has("bar")).to.be.true;
		map.dispose();
		expect(map.has("foo")).to.be.false;
		expect(map.has("bar")).to.be.false;
		expect(map.size).to.equal(0);
	});

	it("allows a disposable list to be replaced with another", () => {
		const cd1 = new CompositeDisposable();
		const cd2 = new CompositeDisposable();
		const key = {};
		const map = new MappedDisposable([[key, cd1]]);
		map.set(key, cd2);
		expect(map.get(key)).to.equal(cd2);
		expect(map.get(key).disposables.has(cd1)).to.be.false;
		map.dispose();
		expect(cd1.disposed).to.be.false;
		expect(cd2.disposed).to.be.true;
	});

	it("throws an error when setting a value to a non-disposable", () => {
		expect(() => {
			const key = {};
			const map = new MappedDisposable([ [key, new Disposable()] ]);
			map.set(key, {});
		}).to.throw("Value must have a .dispose() method");
	});
});
