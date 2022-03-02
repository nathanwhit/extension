// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';
import { objectSpread } from '@polkadot/util';

import { ButtonArea, Dropdown, InputWithLabel, NextStepButton, TextAreaWithLabel, VerticalSpace, Warning } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  onTypeChange: (type: KeypairType) => void;
  type: KeypairType;
}

const keypairTypes = ['ed25519', 'sr25519', 'ecdsa'];

function isKeypairType (value: string): value is KeypairType {
  return keypairTypes.includes(value);
}

function SeedAndPath ({ className, onAccountChange, onNextStep, onTypeChange, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const genesisOptions = useGenesisHashOptions();
  const [address, setAddress] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [advanced, setAdvances] = useState(false);
  const [error, setError] = useState('');
  const [genesis, setGenesis] = useState('');

  const keypairTypeOptions = keypairTypes.map((name: string) => ({
    text: name,
    value: name
  }));

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}${path || ''}`;

    validateSeed(suri, type)
      .then((validatedAccount) => {
        setError('');
        setAddress(validatedAccount.address);
        onAccountChange(
          objectSpread<AccountInfo>({}, validatedAccount, { genesis, type })
        );
      })
      .catch(() => {
        setAddress('');
        onAccountChange(null);
        setError(path
          ? t<string>('Invalid mnemonic seed or derivation path')
          : t<string>('Invalid mnemonic seed')
        );
      });
  }, [t, genesis, seed, path, onAccountChange, type]);

  const _onToggleAdvanced = useCallback(() => {
    setAdvances(!advanced);
  }, [advanced]);

  const _onTypeChange = (value: string) => {
    if (isKeypairType(value)) {
      onTypeChange(value);
    } else {
      setError('');
    }
  };

  return (
    <>
      <div className={className}>
        <TextAreaWithLabel
          className='seedInput'
          isError={!!error}
          isFocused
          label={t<string>('existing 12 or 24-word mnemonic seed')}
          onChange={setSeed}
          rowsCount={2}
          value={seed || ''}
        />
        {!!error && !seed && (
          <Warning
            className='seedError'
            isBelowInput
            isDanger
          >
            {t<string>('Mnemonic needs to contain 12, 15, 18, 21, 24 words')}
          </Warning>
        )}
        <Dropdown
          className='genesisSelection'
          label={t<string>('Network')}
          onChange={setGenesis}
          options={genesisOptions}
          value={genesis}
        />
        <div
          className='advancedToggle'
          onClick={_onToggleAdvanced}
        >
          <FontAwesomeIcon icon={advanced ? faCaretDown : faCaretRight} />
          <span>{t<string>('advanced')}</span>
        </div>
        { advanced && (
          <InputWithLabel
            className='derivationPath'
            isError={!!path && !!error}
            label={t<string>('derivation path')}
            onChange={setPath}
            value={path || ''}
          />
        )}
        { advanced && (
          <Dropdown
            className='cryptoTypeSelection'
            label={t<string>('crypto type')}
            onChange={_onTypeChange}
            options={keypairTypeOptions}
            value={type}
          />
        )}
        {!!error && !!seed && (
          <Warning
            isDanger
          >
            {error}
          </Warning>
        )}
      </div>
      <VerticalSpace />
      <ButtonArea>
        <NextStepButton
          isDisabled={!address || !!error}
          onClick={onNextStep}
        >
          {t<string>('Next')}
        </NextStepButton>
      </ButtonArea>
    </>
  );
}

export default styled(SeedAndPath)(({ theme }: ThemeProps) => `
  .advancedToggle {
    color: ${theme.textColor};
    cursor: pointer;
    line-height: ${theme.lineHeight};
    letter-spacing: 0.04em;
    opacity: 0.65;
    text-transform: uppercase;

    > span {
      font-size: ${theme.inputLabelFontSize};
      margin-left: .5rem;
      vertical-align: middle;
    }
  }

  .genesisSelection {
    margin-bottom: ${theme.fontSize};
  }

  .seedInput {
    margin-bottom: ${theme.fontSize};
    textarea {
      height: unset;
    }
  }

  .seedError {
    margin-bottom: 1rem;
  }
`);
