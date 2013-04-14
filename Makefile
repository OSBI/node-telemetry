REPORTER = spec
INTERFACE = tdd

test:	clean
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
        --ui $(INTERFACE) \
        --ignore-leaks \
        --timeout 5000

clean:
	- rm *.csv

.PHONY: test
