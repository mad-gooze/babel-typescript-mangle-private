class A {
    private foo: string;

    bar() {
        const { foo } = this;
    }

    foobar () {
        console.log(this.foo);
    }
}
