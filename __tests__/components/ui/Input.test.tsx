import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { TextInput } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Input } from '../../../src/components/ui/Input';

describe('Input', () => {
  it('uses predictable typing defaults for prompt-style editors', () => {
    render(<Input value="" onChangeText={jest.fn()} />);

    const input = screen.UNSAFE_getByType(TextInput);

    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
    expect(input.props.spellCheck).toBe(false);
  });

  it('allows callers to override keyboard-related props when needed', () => {
    render(
      <Input
        value=""
        onChangeText={jest.fn()}
        autoCapitalize="sentences"
        autoCorrect
        spellCheck
        autoComplete="email"
        textContentType="emailAddress"
      />
    );

    const input = screen.UNSAFE_getByType(TextInput);

    expect(input.props.autoCapitalize).toBe('sentences');
    expect(input.props.autoCorrect).toBe(true);
    expect(input.props.spellCheck).toBe(true);
    expect(input.props.autoComplete).toBe('email');
    expect(input.props.textContentType).toBe('emailAddress');
  });
});
