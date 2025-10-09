def dataclass_to_dict(instance):
    """
    Convert a dataclass instance to a dictionary, excluding fields with None values.
    """
    if not hasattr(instance, '__dataclass_fields__'):
        raise ValueError("Provided instance is not a dataclass")
    
    result = {}
    for field in instance.__dataclass_fields__:
        value = getattr(instance, field)
        if value is not None:
            if isinstance(value, bytes):
                result[field] = value.decode('latin1')  # Decode bytes to string for JSON compatibility
            else:
                result[field] = str(value)
    return result