import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InteractionManager } from '../src/interactionManager';
import { CuePoint, InteractionPayload } from '../src/types';
import { I18n } from '../src/i18n';

describe('InteractionManager', () => {
  let interactionManager: InteractionManager;
  let mockOnPromptCallback: vi.Mock;
  let mockOnResponseCallback: vi.Mock;
  let mockContainer: HTMLElement;
  let mockI18n: I18n;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the container element with necessary DOM methods
    mockContainer = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLElement;

    // Mock document.createElement for elements created by InteractionManager
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const mockElement = {
        appendChild: vi.fn(),
        remove: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        setAttribute: vi.fn(),
        textContent: '',
        className: '',
        dataset: {},
        value: '',
      } as unknown as HTMLElement;

      if (tagName === 'input') {
        (mockElement as HTMLInputElement).value = '';
      }

      return mockElement;
    });

    mockI18n = {
      translate: vi.fn((key) => key),
    } as unknown as I18n;

    const mockDecisionAdapter = {
      saveDecision: vi.fn(),
      getDecisionHistory: vi.fn(),
      clearDecisionHistory: vi.fn(),
    };
    interactionManager = new InteractionManager(mockContainer, mockI18n, mockDecisionAdapter);
    mockOnPromptCallback = vi.fn();
    mockOnResponseCallback = vi.fn();

    interactionManager.onPrompt(mockOnPromptCallback);
    interactionManager.onResponse(mockOnResponseCallback);
  });

  it('should register onPrompt callback', () => {
    const newCallback = vi.fn();
    interactionManager.onPrompt(newCallback);
    // Trigger handleInteractionCue to check if the new callback is used
    const cue: CuePoint = { id: 'test', time: 1, payload: { interaction: { type: 'choice', question: 'Q?' } } };
    interactionManager.handleInteractionCue(cue);
    expect(newCallback).toHaveBeenCalledTimes(1);
    expect(mockOnPromptCallback).not.toHaveBeenCalled(); // Ensure old callback is replaced
  });

  it('should register onResponse callback', () => {
    const newCallback = vi.fn();
    interactionManager.onResponse(newCallback);
    // Trigger handleUserResponse to check if the new callback is used
    const cue: CuePoint = { id: 'test', time: 1 };
    interactionManager.handleUserResponse('response', cue);
    expect(newCallback).toHaveBeenCalledTimes(1);
    expect(mockOnResponseCallback).not.toHaveBeenCalled(); // Ensure old callback is replaced
  });

  it('should call onPrompt callback when handleInteractionCue is called with payload', () => {
    const interactionPayload: InteractionPayload = { type: 'choice', question: 'What is your favorite color?' };
    const cue: CuePoint = { id: 'cue1', time: 10, payload: { interaction: interactionPayload } };

    interactionManager.handleInteractionCue(cue);

    expect(mockOnPromptCallback).toHaveBeenCalledTimes(1);
    expect(mockOnPromptCallback).toHaveBeenCalledWith(interactionPayload, cue);
  });

  it('should not call onPrompt callback if no interaction payload', () => {
    const cue: CuePoint = { id: 'cue1', time: 10, payload: {} };
    interactionManager.handleInteractionCue(cue);
    expect(mockOnPromptCallback).not.toHaveBeenCalled();
  });

  it('should not call onPrompt callback if payload.interaction is undefined', () => {
    const cue: CuePoint = { id: 'cue1', time: 10, payload: { someOtherData: 'abc' } };
    interactionManager.handleInteractionCue(cue);
    expect(mockOnPromptCallback).not.toHaveBeenCalled();
  });

  it('should call onResponse callback when handleUserResponse is called', () => {
    const response = 'User Answer';
    const cue: CuePoint = { id: 'cue2', time: 20 };

    interactionManager.handleUserResponse(response, cue);

    expect(mockOnResponseCallback).toHaveBeenCalledTimes(1);
    expect(mockOnResponseCallback).toHaveBeenCalledWith(response, cue);
  });

  it('should destroy callbacks', () => {
    interactionManager.destroy();

    const interactionPayload: InteractionPayload = { type: 'text', question: 'Enter text' };
    const cue: CuePoint = { id: 'cue3', time: 30, payload: { interaction: interactionPayload } };
    interactionManager.handleInteractionCue(cue);
    interactionManager.handleUserResponse('another response', cue);

    expect(mockOnPromptCallback).not.toHaveBeenCalled();
    expect(mockOnResponseCallback).not.toHaveBeenCalled();
  });

  it('should log interactions when loadInteractions is called', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const interactions = [{ id: 'int1' }, { id: 'int2' }];
    interactionManager.loadInteractions(interactions);
    expect(consoleSpy).toHaveBeenCalledWith('Interactions loaded into store:', expect.any(Map));
    consoleSpy.mockRestore();
  });
});
