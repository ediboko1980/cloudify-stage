package co.cloudify.rest.helpers;

import org.slf4j.Logger;

import co.cloudify.rest.client.CloudifyClient;
import co.cloudify.rest.model.Event;
import co.cloudify.rest.model.EventLevel;

public class Slf4JLogEmitterExecutionFollower extends LogEmitterExecutionFollower {
	private Logger logger;

	public Slf4JLogEmitterExecutionFollower(final CloudifyClient client, final Logger logger) {
		super(client);
		this.logger = logger;
	}

	public Slf4JLogEmitterExecutionFollower(final CloudifyClient client, final Logger logger, final long size) {
		super(client, size);
		this.logger = logger;
	}

	@Override
	protected void emit(final Event event) {
		EventLevel level = event.getLevel();
		String text = EventsHelper.formatEvent(event, false);
		switch (level) {
		case debug:
			logger.debug(text);
			break;
		case error:
			logger.error(text);
			break;
		case info:
			logger.info(text);
			break;
		case warning:
			logger.warn(text);
			break;
		default:
			logger.info("[Unrecognized level: {}] {}", level, text);
			break;
		}
	}
}
