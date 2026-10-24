# Over-engineering in Python

The task was to add a function that returns the VAT for a price at 20 percent.

Too much

```python
from abc import ABC, abstractmethod


class TaxStrategy(ABC):
    @abstractmethod
    def compute(self, amount): ...


class VatStrategy(TaxStrategy):
    def __init__(self, rate):
        self.rate = rate

    def compute(self, amount):
        return amount * self.rate


class TaxCalculatorFactory:
    @staticmethod
    def create(kind="vat", rate=0.2):
        if kind == "vat":
            return VatStrategy(rate)
        raise ValueError(kind)
```

Enough

```python
from decimal import ROUND_HALF_UP, Decimal

VAT_RATE = Decimal("0.20")
CENT = Decimal("0.01")


def vat_for(price: Decimal) -> Decimal:
    return (price * VAT_RATE).quantize(CENT, rounding=ROUND_HALF_UP)
```

Money results are rounded to the currency's minor unit. Use the rounding mode the business requires.

Add the strategy pattern when a second tax type actually exists.
